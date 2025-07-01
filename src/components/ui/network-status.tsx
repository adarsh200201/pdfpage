import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

export function NetworkStatus() {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-sm">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div className="text-sm">
          <p className="font-medium">All Tools Are Available!</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-green-600/60 hover:text-green-600 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
