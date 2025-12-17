import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { checkBackendHealth } from '@/lib/api-config';

export function BackendStatusNotification() {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Don't show on auth callback page (we handle it with JWT fallback)
    if (location.pathname === '/auth/callback') {
      setIsChecking(false);
      return;
    }

    // Only check in production
    if (import.meta.env.DEV) {
      setIsChecking(false);
      return;
    }

    const checkBackend = async () => {
      setIsWakingUp(true);
      setShowNotification(true);
      
      const isHealthy = await checkBackendHealth(3);
      
      if (isHealthy) {
        setIsWakingUp(false);
        // Hide notification after 2 seconds
        setTimeout(() => setShowNotification(false), 2000);
      } else {
        setIsWakingUp(false);
        setShowNotification(true);
      }
      
      setIsChecking(false);
    };

    checkBackend();
  }, []);

  if (!showNotification || isChecking) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {isWakingUp ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Backend Starting Up
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Our free backend server is waking up. This takes about 30 seconds.
                  <br />
                  <span className="text-xs">Please wait...</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Backend Unavailable
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Unable to connect to backend server.
                  <br />
                  <span className="text-xs">Please try again in a few moments.</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
