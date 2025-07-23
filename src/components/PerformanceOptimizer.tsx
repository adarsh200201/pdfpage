import { useEffect } from 'react';

interface PerformanceOptimizerProps {
  enableLazyLoading?: boolean;
  enableImageOptimization?: boolean;
  enableResourceHints?: boolean;
  enableCriticalCSS?: boolean;
}

const PerformanceOptimizer = ({
  enableLazyLoading = true,
  enableImageOptimization = true,
  enableResourceHints = true,
  enableCriticalCSS = true
}: PerformanceOptimizerProps) => {
  
  useEffect(() => {
    // 1. Critical CSS Inlining
    if (enableCriticalCSS) {
      const inlineCriticalCSS = () => {
        const criticalCSS = `
          /* Critical above-the-fold styles */
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
          .hero-section { min-height: 50vh; }
          .loading-skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); }
          .btn-primary { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        `;
        
        const style = document.createElement('style');
        style.innerHTML = criticalCSS;
        style.setAttribute('data-critical', 'true');
        document.head.insertBefore(style, document.head.firstChild);
      };
      
      inlineCriticalCSS();
    }

    // 2. Lazy Loading Implementation
    if (enableLazyLoading) {
      const setupLazyLoading = () => {
        // Native lazy loading fallback for older browsers
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                  imageObserver.unobserve(img);
                }
              }
            });
          }, {
            rootMargin: '50px 0px',
            threshold: 0.01
          });

          // Observe all images with data-src
          const lazyImages = document.querySelectorAll('img[data-src]');
          lazyImages.forEach(img => imageObserver.observe(img));

          // Lazy load components
          const componentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const element = entry.target as HTMLElement;
                if (element.dataset.component) {
                  // Load component dynamically
                  import(`@/components/${element.dataset.component}`).then(module => {
                    // Component loading logic here
                  });
                  componentObserver.unobserve(element);
                }
              }
            });
          });

          const lazyComponents = document.querySelectorAll('[data-component]');
          lazyComponents.forEach(comp => componentObserver.observe(comp));
        }
      };

      setupLazyLoading();
    }

    // 3. Image Optimization
    if (enableImageOptimization) {
      const optimizeImages = () => {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          // Add loading attribute for modern browsers
          if (!img.hasAttribute('loading')) {
            const isAboveFold = img.getBoundingClientRect().top < window.innerHeight;
            img.loading = isAboveFold ? 'eager' : 'lazy';
          }

          // Add fetchpriority for important images
          if (img.classList.contains('hero-image') || img.dataset.priority === 'high') {
            img.fetchPriority = 'high';
          }

          // Optimize image formats
          if (img.src && !img.src.includes('.webp') && !img.src.includes('.avif')) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx && 'createImageBitmap' in window) {
              fetch(img.src)
                .then(response => response.blob())
                .then(blob => createImageBitmap(blob))
                .then(bitmap => {
                  canvas.width = bitmap.width;
                  canvas.height = bitmap.height;
                  ctx.drawImage(bitmap, 0, 0);
                  
                  // Convert to WebP if supported
                  if (canvas.toBlob && 'webp' in document.createElement('canvas').getContext('2d')) {
                    canvas.toBlob(webpBlob => {
                      if (webpBlob && webpBlob.size < blob.size * 0.8) {
                        img.src = URL.createObjectURL(webpBlob);
                      }
                    }, 'image/webp', 0.9);
                  }
                })
                .catch(() => {
                  // Fallback: continue with original image
                });
            }
          }
        });
      };

      // Run after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', optimizeImages);
      } else {
        optimizeImages();
      }
    }

    // 4. Resource Hints and Preloading
    if (enableResourceHints) {
      const addResourceHints = () => {
        const hints = [
          // DNS prefetch for external domains
          { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
          { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
          { rel: 'dns-prefetch', href: '//www.googletagmanager.com' },
          { rel: 'dns-prefetch', href: '//www.google-analytics.com' },
          { rel: 'dns-prefetch', href: '//pagead2.googlesyndication.com' },
          
          // Preconnect for critical resources
          { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
          
          // Preload critical resources
          { rel: 'preload', href: '/logo.svg', as: 'image' },
          { rel: 'preload', href: '/icons/apple-touch-icon.png', as: 'image' }
        ];

        hints.forEach(hint => {
          // Check if hint already exists
          const existing = document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`);
          if (!existing) {
            const link = document.createElement('link');
            link.rel = hint.rel;
            link.href = hint.href;
            if (hint.as) link.as = hint.as;
            if (hint.crossOrigin) link.crossOrigin = hint.crossOrigin;
            document.head.appendChild(link);
          }
        });
      };

      addResourceHints();
    }

    // 5. Script Optimization
    const optimizeScripts = () => {
      // Defer non-critical scripts
      const nonCriticalScripts = document.querySelectorAll('script[data-defer="true"]');
      nonCriticalScripts.forEach(script => {
        if (script instanceof HTMLScriptElement && !script.defer) {
          script.defer = true;
        }
      });

      // Load analytics scripts after page interaction
      let interactionDetected = false;
      const loadAnalytics = () => {
        if (interactionDetected) return;
        interactionDetected = true;

        // Load Google Analytics
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
        document.head.appendChild(gaScript);

        // Initialize GA
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
      };

      // Load on first interaction
      ['mousedown', 'touchstart', 'keydown', 'scroll'].forEach(event => {
        document.addEventListener(event, loadAnalytics, { once: true, passive: true });
      });

      // Fallback: load after 5 seconds
      setTimeout(loadAnalytics, 5000);
    };

    optimizeScripts();

    // 6. Service Worker Registration
    const registerServiceWorker = () => {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('[SW] Registration successful', registration);
            })
            .catch(error => {
              console.log('[SW] Registration failed', error);
            });
        });
      }
    };

    registerServiceWorker();

    // 7. Memory Management
    const optimizeMemory = () => {
      // Clean up unused images
      const cleanupImages = () => {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          const rect = img.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight + 1000 && rect.bottom > -1000;
          
          if (!isVisible && img.src && img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
          }
        });
      };

      // Run cleanup periodically
      setInterval(cleanupImages, 30000);
    };

    optimizeMemory();

    // 8. Prefetch Next Page Resources
    const prefetchNextPage = () => {
      const links = document.querySelectorAll('a[href^="/"]');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = link.href;
            document.head.appendChild(prefetchLink);
            observer.unobserve(link);
          }
        });
      });

      links.forEach(link => observer.observe(link));
    };

    prefetchNextPage();

  }, [enableLazyLoading, enableImageOptimization, enableResourceHints, enableCriticalCSS]);

  // This component doesn't render anything
  return null;
};

export default PerformanceOptimizer;
