import { useEffect, useState } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

interface WebVitalsData {
  LCP: number | null;
  INP: number | null;
  CLS: number | null;
  FCP: number | null;
  TTFB: number | null;
}

interface CoreWebVitalsProps {
  debug?: boolean;
  onReport?: (metric: Metric) => void;
}

const CoreWebVitals = ({ debug = false, onReport }: CoreWebVitalsProps) => {
  const [vitals, setVitals] = useState<WebVitalsData>({
    LCP: null,
    INP: null,
    CLS: null,
    FCP: null,
    TTFB: null,
  });

  useEffect(() => {
    // Enhanced metric collection with reporting
    const handleMetric = (metric: Metric) => {
      setVitals(prev => ({
        ...prev,
        [metric.name]: metric.value
      }));

      // Report to analytics
      if (onReport) {
        onReport(metric);
      }

      // Send to Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          metric_id: metric.id,
          metric_value: metric.value,
          metric_delta: metric.delta,
          custom_parameter_1: 'core_web_vitals'
        });
      }

      // Log for debugging
      if (debug) {
        console.log(`[Core Web Vitals] ${metric.name}:`, {
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
          rating: getMetricRating(metric.name, metric.value)
        });
      }
    };

    // Collect all Core Web Vitals
    onCLS(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);

    // Performance observer for additional metrics
    if ('PerformanceObserver' in window) {
      // Monitor layout shifts in real-time
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            if (debug) {
              console.log('[Layout Shift]', entry);
            }
          }
        }
      });

      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // Fallback for older browsers
      }

      // Monitor long tasks that could affect INP
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            if (debug) {
              console.log('[Long Task]', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              });
            }
          }
        }
      });

      try {
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch (e) {
        // Fallback for older browsers
      }

      return () => {
        clsObserver.disconnect();
        longTaskObserver.disconnect();
      };
    }
  }, [debug, onReport]);

  // Performance optimization helpers
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      const criticalResources = [
        '/fonts/inter-var.woff2',
        '/icons/apple-touch-icon.png',
        '/logo.svg'
      ];

      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = resource.includes('.woff') ? 'font' : 'image';
        link.href = resource;
        if (resource.includes('.woff')) {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      });
    };

    // Optimize images for better LCP
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-priority="high"]');
      images.forEach(img => {
        if (img instanceof HTMLImageElement) {
          img.loading = 'eager';
          img.fetchPriority = 'high';
        }
      });
    };

    // Defer non-critical scripts
    const deferNonCriticalScripts = () => {
      const scripts = document.querySelectorAll('script[data-defer="true"]');
      scripts.forEach(script => {
        if (script instanceof HTMLScriptElement) {
          script.defer = true;
        }
      });
    };

    // Run optimizations
    preloadCriticalResources();
    optimizeImages();
    deferNonCriticalScripts();

    // Implement resource hints
    const addResourceHints = () => {
      const hints = [
        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
        { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }
      ];

      hints.forEach(hint => {
        const link = document.createElement('link');
        link.rel = hint.rel;
        link.href = hint.href;
        if (hint.crossOrigin) {
          link.crossOrigin = hint.crossOrigin;
        }
        document.head.appendChild(link);
      });
    };

    addResourceHints();
  }, []);

  if (!debug) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-2">Core Web Vitals</h3>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={getColorClass('LCP', vitals.LCP)}>
            {vitals.LCP ? `${vitals.LCP.toFixed(0)}ms` : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>INP:</span>
          <span className={getColorClass('INP', vitals.INP)}>
            {vitals.INP ? `${vitals.INP.toFixed(0)}ms` : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>CLS:</span>
          <span className={getColorClass('CLS', vitals.CLS)}>
            {vitals.CLS ? vitals.CLS.toFixed(3) : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={getColorClass('FCP', vitals.FCP)}>
            {vitals.FCP ? `${vitals.FCP.toFixed(0)}ms` : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>TTFB:</span>
          <span className={getColorClass('TTFB', vitals.TTFB)}>
            {vitals.TTFB ? `${vitals.TTFB.toFixed(0)}ms` : 'Loading...'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getMetricRating = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    INP: { good: 200, poor: 500 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 }
  };

  const threshold = thresholds[metric as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

const getColorClass = (metric: string, value: number | null): string => {
  if (value === null) return 'text-gray-400';
  
  const rating = getMetricRating(metric, value);
  switch (rating) {
    case 'good': return 'text-green-400';
    case 'needs-improvement': return 'text-yellow-400';
    case 'poor': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

export default CoreWebVitals;
