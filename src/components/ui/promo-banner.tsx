import { X } from "lucide-react";
import { useState } from "react";

interface PromoBannerProps {
  className?: string;
  onClose?: () => void;
  closeable?: boolean;
}

export function PromoBanner({
  className = "",
  onClose,
  closeable = true,
}: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`bg-gradient-to-r from-brand-red/10 to-red-100 border-l-4 border-brand-red p-6 rounded-lg shadow-sm text-brand-red relative ${className}`}
    >
      {closeable && (
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-brand-red/60 hover:text-brand-red transition-colors p-1"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="pr-8">
        <p className="text-lg font-bold text-brand-red mb-3">
          📣 <strong>Limited Time Offer:</strong>
        </p>

        <div className="space-y-3 text-sm md:text-base font-medium">
          <p className="hidden md:block">
            ✨ No limits, no locks, no need to pay,
            <br />
            All our tools are{" "}
            <strong className="text-brand-red">100% free</strong> — starting
            today!
            <br />
            Merge, compress, or create your resume,
            <br />
            Unlimited access, come and play!
          </p>

          <p className="hidden md:block">
            For <strong className="text-brand-red">3 full months</strong>, enjoy
            our best,
            <br />
            No ads, no limits, just give it a test.
            <br />
            After that, choose free or go Pro,
            <br />
            But for now, just{" "}
            <strong className="text-brand-red">enjoy the flow</strong>. 🚀
          </p>

          {/* Mobile version - shorter text */}
          <p className="md:hidden">
            ✨ <strong className="text-brand-red">3 months FREE!</strong> All
            tools unlocked, no limits, no ads. Try everything before deciding on
            a plan! 🚀
          </p>

          <p className="font-bold text-brand-red border-t border-brand-red/20 pt-3">
            🔓 Everything is unlocked — try it now before the timer runs out!
          </p>
        </div>
      </div>
    </div>
  );
}
