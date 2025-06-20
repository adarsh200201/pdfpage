import { useState } from "react";
import { Crown, X } from "lucide-react";

export function NetworkStatus() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gradient-to-r from-brand-red/10 to-red-100 border border-brand-red/30 text-brand-red px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-sm">
        <Crown className="w-5 h-5 text-brand-red" />
        <div className="text-sm">
          <p className="font-medium">3 Months Free Active!</p>
          <p className="text-xs">All premium features unlocked</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-brand-red/60 hover:text-brand-red transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
