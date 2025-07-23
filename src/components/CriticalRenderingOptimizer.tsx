import { useEffect, useRef, useState } from 'react';

interface CriticalRenderingOptimizerProps {
  enableCriticalCSS?: boolean;
  enableLazyImages?: boolean;
  enableLazyComponents?: boolean;
  enableResourcePrioritization?: boolean;
  enablePreloading?: boolean;
}

const CriticalRenderingOptimizer = ({
  enableCriticalCSS = true,
  enableLazyImages = true,
  enableLazyComponents = true,
  enableResourcePrioritization = true,
  enablePreloading = true
}: CriticalRenderingOptimizerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    // 1. Critical CSS Inlining for Above-the-Fold Content
    if (enableCriticalCSS) {
      const inlineCriticalCSS = () => {
        const criticalCSS = `
          /* Critical above-the-fold styles for immediate rendering */
          html { font-display: swap; }
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.5;
          }
          .hero-section, .main-header { 
            display: block;
            min-height: 100px;
          }
          .loading-skeleton { 
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          .btn-primary { 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
          }
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            padding: 24px;
          }
          /* Prevent layout shift */
          img[data-lazy] {
            min-height: 200px;
            background-color: #f3f4f6;
          }
          .aspect-video { aspect-ratio: 16/9; }
          .aspect-square { aspect-ratio: 1/1; }
          /* Font loading optimization */
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 100 900;
            font-display: swap;
            src: url('/fonts/inter-var.woff2') format('woff2');
          }
        `;
        
        // Check if critical CSS is already injected
        if (!document.querySelector('style[data-critical="true"]')) {
          const style = document.createElement('style');
          style.innerHTML = criticalCSS;
          style.setAttribute('data-critical', 'true');
          style.setAttribute('data-priority', 'high');
          document.head.insertBefore(style, document.head.firstChild);
        }
      };
      
      inlineCriticalCSS();
    }

    // 2. Advanced Lazy Loading with Intersection Observer
    if (enableLazyImages) {
      const setupAdvancedLazyLoading = () => {
        // Progressive image loading with blur-up effect
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              
              // Load high-res image
              if (img.dataset.src) {
                const tempImg = new Image();
                tempImg.onload = () => {
                  // Fade transition effect
                  img.style.transition = 'opacity 0.3s ease-in-out';
                  img.style.opacity = '0';
                  img.src = img.dataset.src!;
                  img.removeAttribute('data-src');
                  
                  setTimeout(() => {
                    img.style.opacity = '1';
                  }, 50);
                };
                tempImg.src = img.dataset.src;
                imageObserver.unobserve(img);
              }
            }
          });
        }, {
          rootMargin: '50px 0px',
          threshold: 0.1
        });

        // Observe all lazy images
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));

        // Background image lazy loading
        const bgImageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              if (element.dataset.bgSrc) {
                element.style.backgroundImage = `url(${element.dataset.bgSrc})`;
                element.removeAttribute('data-bg-src');
                bgImageObserver.unobserve(element);
              }
            }
          });
        }, { rootMargin: '100px 0px' });

        const lazyBgElements = document.querySelectorAll('[data-bg-src]');
        lazyBgElements.forEach(el => bgImageObserver.observe(el));
      };

      setupAdvancedLazyLoading();
    }

    // 3. Component-Level Lazy Loading
    if (enableLazyComponents) {
      const setupComponentLazyLoading = () => {
        const componentObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement;
              const componentName = element.dataset.component;
              
              if (componentName) {
                // Dynamic import with error handling
                import(`@/components/${componentName}`)
                  .then(module => {
                    const Component = module.default;
                    // Create component instance and replace placeholder
                    element.innerHTML = '';
                    element.setAttribute('data-loaded', 'true');
                  })
                  .catch(error => {
                    console.warn(`Failed to lazy load component: ${componentName}`, error);
                    element.innerHTML = '<div class="text-gray-500">Component unavailable</div>';
                  });
                
                componentObserver.unobserve(element);
              }
            }
          });
        }, { rootMargin: '200px 0px' });

        const lazyComponents = document.querySelectorAll('[data-component]');
        lazyComponents.forEach(comp => componentObserver.observe(comp));
      };

      setupComponentLazyLoading();
    }

    // 4. Resource Prioritization
    if (enableResourcePrioritization) {
      const prioritizeResources = () => {
        // High priority resources
        const criticalResources = [
          { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
          { href: '/logo.svg', as: 'image' },
          { href: '/icons/apple-touch-icon.png', as: 'image' }
        ];

        criticalResources.forEach(resource => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = resource.href;
          link.as = resource.as;
          if (resource.type) link.type = resource.type;
          if (resource.as === 'font') link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        });

        // Low priority resources (defer)
        const deferredResources = document.querySelectorAll('link[data-defer="true"]');
        deferredResources.forEach(link => {
          setTimeout(() => {
            (link as HTMLLinkElement).media = 'all';
          }, 1000);
        });
      };

      prioritizeResources();
    }

    // 5. Advanced Preloading Strategies
    if (enablePreloading) {
      const setupPreloading = () => {
        // Preload critical pages on hover
        const setupHoverPreload = () => {
          const links = document.querySelectorAll('a[href^="/"]');
          const preloadedPages = new Set();

          links.forEach(link => {
            link.addEventListener('mouseenter', () => {
              const href = (link as HTMLAnchorElement).href;
              if (!preloadedPages.has(href)) {
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'prefetch';
                preloadLink.href = href;
                document.head.appendChild(preloadLink);
                preloadedPages.add(href);
              }
            }, { once: true });
          });
        };

        // Preload next probable pages based on current page
        const setupIntelligentPreload = () => {
          const currentPath = window.location.pathname;
          const preloadMap: Record<string, string[]> = {
            '/': ['/img', '/merge', '/compress', '/available-tools'],
            '/img': ['/img/compress', '/img/resize', '/img/crop'],
            '/merge': ['/split', '/compress', '/organize-pdf'],
            '/compress': ['/merge', '/split', '/pdf-to-word']
          };

          const pagesToPreload = preloadMap[currentPath];
          if (pagesToPreload) {
            pagesToPreload.forEach((page, index) => {
              setTimeout(() => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = page;
                document.head.appendChild(link);
              }, index * 500);
            });
          }
        };

        setupHoverPreload();
        setupIntelligentPreload();
      };

      setupPreloading();
    }

    // 6. Script Loading Optimization
    const optimizeScriptLoading = () => {
      // Defer non-critical scripts
      const nonCriticalScripts = document.querySelectorAll('script[data-defer="true"]');
      nonCriticalScripts.forEach(script => {
        if (script instanceof HTMLScriptElement) {
          script.defer = true;
        }
      });

      // Load analytics after user interaction
      let analyticsLoaded = false;
      const loadAnalytics = () => {
        if (analyticsLoaded) return;
        analyticsLoaded = true;

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

      // Load on first interaction or after 10 seconds
      ['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
        document.addEventListener(event, loadAnalytics, { once: true, passive: true });
      });
      setTimeout(loadAnalytics, 10000);
    };

    optimizeScriptLoading();

    // 7. Memory Management
    const optimizeMemory = () => {
      // Clean up blob URLs
      const cleanupBlobs = () => {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (img.src.startsWith('blob:')) {
            const rect = img.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight + 1000 && rect.bottom > -1000;
            
            if (!isVisible) {
              URL.revokeObjectURL(img.src);
            }
          }
        });
      };

      // Run cleanup every 30 seconds
      setInterval(cleanupBlobs, 30000);

      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        const blobUrls = Array.from(document.querySelectorAll('img'))
          .map(img => img.src)
          .filter(src => src.startsWith('blob:'));
        
        blobUrls.forEach(url => URL.revokeObjectURL(url));
      });
    };

    optimizeMemory();

    // 8. Service Worker for Caching
    const registerServiceWorker = () => {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('[SW] Registration successful');
              
              // Update available
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      // New version available
                      console.log('[SW] New version available');
                    }
                  });
                }
              });
            })
            .catch(error => {
              console.log('[SW] Registration failed:', error);
            });
        });
      }
    };

    registerServiceWorker();

  }, [enableCriticalCSS, enableLazyImages, enableLazyComponents, enableResourcePrioritization, enablePreloading]);

  // This component doesn't render anything visible
  return null;
};

export default CriticalRenderingOptimizer;
