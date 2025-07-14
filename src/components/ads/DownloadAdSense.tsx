import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface DownloadAdSenseProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal" | "banner";
  style?: React.CSSProperties;
  className?: string;
  onAdLoad?: () => void;
  onAdError?: () => void;
  fallbackContent?: React.ReactNode;
}

const DownloadAdSense: React.FC<DownloadAdSenseProps> = ({
  adSlot,
  adFormat = "rectangle",
  style = {},
  className = "",
  onAdLoad,
  onAdError,
  fallbackContent,
}) => {
  const { user } = useAuth();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adPushed = useRef(false);

  useEffect(() => {
    // Don't load AdSense in development environment - show placeholder instead
    if (process.env.NODE_ENV === "development") {
      console.log("📺 AdSense placeholder loaded in development mode");
      setAdLoaded(true);
      onAdLoad?.();
      return;
    }

    // Don't load if no publisher ID configured
    if (
      !import.meta.env.VITE_ADSENSE_PUBLISHER_ID ||
      import.meta.env.VITE_ADSENSE_PUBLISHER_ID === "ca-pub-YOUR_PUBLISHER_ID"
    ) {
      console.log("⚠️ AdSense publisher ID not configured");
      setAdError(true);
      onAdError?.();
      return;
    }

    const loadAdSense = async () => {
      try {
        // Load AdSense script if not already loaded
        if (!window.adsbygoogle) {
          const script = document.createElement("script");
          script.async = true;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${import.meta.env.VITE_ADSENSE_PUBLISHER_ID}`;
          script.crossOrigin = "anonymous";

          await new Promise((resolve, reject) => {
            script.onload = () => {
              console.log("✅ AdSense script loaded successfully");
              resolve(void 0);
            };
            script.onerror = (error) => {
              console.error("❌ Failed to load AdSense script:", error);
              reject(error);
            };
            document.head.appendChild(script);
          });
        }

        // Push ad after script is loaded
        if (!adPushed.current && adContainerRef.current) {
          adPushed.current = true;

          // Small delay to ensure DOM is ready
          setTimeout(() => {
            try {
              if (window.adsbygoogle && adContainerRef.current) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                console.log("📺 AdSense ad pushed successfully");

                // Monitor for ad load - AdSense doesn't provide direct callbacks
                // so we use a simple timeout-based approach
                setTimeout(() => {
                  if (adContainerRef.current) {
                    const adIframe =
                      adContainerRef.current.querySelector("iframe");
                    if (adIframe) {
                      setAdLoaded(true);
                      onAdLoad?.();
                    } else {
                      // No iframe found, consider it an error
                      setAdError(true);
                      onAdError?.();
                    }
                  }
                }, 2000);
              }
            } catch (error) {
              console.error("❌ AdSense push error:", error);
              setAdError(true);
              onAdError?.();
            }
          }, 100);
        }
      } catch (error) {
        console.error("❌ AdSense loading error:", error);
        setAdError(true);
        onAdError?.();
      }
    };

    loadAdSense();
  }, [adSlot, onAdLoad, onAdError]);

  // Development mode placeholder
  if (process.env.NODE_ENV === "development") {
    return (
      <div
        ref={adContainerRef}
        className={cn(
          "text-center bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-lg p-6",
          className,
        )}
        style={{
          minHeight: adFormat === "rectangle" ? "250px" : "auto",
          ...style,
        }}
      >
        <div className="text-xs text-blue-400 mb-2 font-semibold">
          📺 Advertisement (Development Mode)
        </div>
        <div className="text-blue-600 text-sm mb-2">Google AdSense Preview</div>
        <div className="text-xs text-blue-500 opacity-70">
          Format: {adFormat} | Slot: {adSlot}
        </div>
        <div className="mt-4 text-2xl">🎯</div>
      </div>
    );
  }

  // Show fallback if ad failed to load or no publisher ID
  if (adError || !import.meta.env.VITE_ADSENSE_PUBLISHER_ID) {
    return fallbackContent ? (
      <div className={cn("text-center", className)} style={style}>
        {fallbackContent}
      </div>
    ) : null;
  }

  // Get appropriate dimensions for different ad formats
  const getAdDimensions = () => {
    switch (adFormat) {
      case "rectangle":
        return { width: "300px", height: "250px" };
      case "banner":
        return { width: "728px", height: "90px" };
      case "vertical":
        return { width: "160px", height: "600px" };
      case "horizontal":
        return { width: "728px", height: "90px" };
      default:
        return { width: "100%", height: "250px" };
    }
  };

  const adDimensions = getAdDimensions();

  return (
    <div
      ref={adContainerRef}
      className={cn(
        "text-center flex flex-col items-center justify-center",
        className,
      )}
      style={style}
    >
      <div className="text-xs text-gray-400 mb-2">Advertisement</div>
      <ins
        className="adsbygoogle block"
        style={{
          display: "block",
          width: adDimensions.width,
          height: adDimensions.height,
          maxWidth: "100%",
        }}
        data-ad-client={import.meta.env.VITE_ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat === "auto" ? "auto" : undefined}
        data-full-width-responsive={adFormat === "auto" ? "true" : "false"}
      />

      {/* Loading indicator while ad loads */}
      {!adLoaded && !adError && (
        <div className="mt-4 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-2 text-xs text-gray-500">Loading ad...</span>
        </div>
      )}
    </div>
  );
};

// Declare global types for AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default DownloadAdSense;
