import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AdSenseProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal";
  style?: React.CSSProperties;
  className?: string;
}

const AdSense: React.FC<AdSenseProps> = ({
  adSlot,
  adFormat = "auto",
  style = {},
  className = "",
}) => {
  const { user } = useAuth();

  useEffect(() => {
    // Only load ads for non-premium users
    if (user?.isPremium) return;

    // Don't load AdSense in development environment
    if (process.env.NODE_ENV === "development") {
      console.log("AdSense disabled in development mode");
      return;
    }

    // Don't load if placeholder publisher ID
    if (
      !process.env.VITE_ADSENSE_PUBLISHER_ID ||
      process.env.VITE_ADSENSE_PUBLISHER_ID === "ca-pub-YOUR_PUBLISHER_ID"
    ) {
      console.log("AdSense publisher ID not configured");
      return;
    }

    try {
      // Load AdSense script if not already loaded
      if (!window.adsbygoogle) {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.VITE_ADSENSE_PUBLISHER_ID}`;
        script.crossOrigin = "anonymous";
        script.onerror = (error) => {
          console.error("Failed to load AdSense script:", error);
        };
        document.head.appendChild(script);
      }

      // Push ad after a short delay to ensure script is loaded
      setTimeout(() => {
        try {
          if (window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        } catch (e) {
          console.error("AdSense error:", e);
        }
      }, 100);
    } catch (e) {
      console.error("AdSense script loading error:", e);
    }
  }, [user?.isPremium]);

  // Don't show ads for premium users
  if (user?.isPremium) {
    return null;
  }

  // Show placeholder in development
  if (process.env.NODE_ENV === "development") {
    return (
      <div
        className={`text-center ${className} bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8`}
        style={style}
      >
        <div className="text-xs text-gray-400 mb-2">
          Advertisement (Development Mode)
        </div>
        <div className="text-gray-500 text-sm">
          AdSense Placeholder - Slot: {adSlot}
        </div>
      </div>
    );
  }

  // Don't render if no publisher ID configured
  if (
    !process.env.VITE_ADSENSE_PUBLISHER_ID ||
    process.env.VITE_ADSENSE_PUBLISHER_ID === "ca-pub-YOUR_PUBLISHER_ID"
  ) {
    return null;
  }

  return (
    <div className={`text-center ${className}`} style={style}>
      <div className="text-xs text-gray-400 mb-2">Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          height: adFormat === "auto" ? "auto" : "250px",
          ...style,
        }}
        data-ad-client={process.env.VITE_ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

// Declare global types for AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default AdSense;
