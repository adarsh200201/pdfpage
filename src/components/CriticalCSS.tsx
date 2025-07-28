import { useEffect } from 'react';

const CriticalCSS = () => {
  useEffect(() => {
    // Critical CSS inlined for fastest possible render
    const criticalCSS = `
      /* Critical styles for above-the-fold content */
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        margin: 0; 
        padding: 0; 
        line-height: 1.6;
      }
      
      /* Header critical styles */
      .header-critical {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(229, 231, 235, 0.3);
        height: 80px;
      }
      
      /* Hero section critical styles */
      .hero-critical {
        padding-top: 100px;
        padding-bottom: 40px;
        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f0f8ff 100%);
        min-height: 600px;
      }
      
      .hero-title-critical {
        font-size: 3.5rem;
        font-weight: 800;
        line-height: 1.1;
        margin-bottom: 1.5rem;
        background: linear-gradient(135deg, #dc2626, #b91c1c, #991b1b);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      /* Button critical styles */
      .btn-primary-critical {
        background: linear-gradient(135deg, #dc2626, #b91c1c, #991b1b);
        color: white;
        padding: 16px 40px;
        border-radius: 12px;
        font-weight: 700;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
        transition: all 0.3s ease;
      }
      
      .btn-primary-critical:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 35px rgba(220, 38, 38, 0.4);
      }
      
      /* Logo critical styles */
      .logo-critical {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #dc2626, #b91c1c, #991b1b);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
      }
      
      /* Stats section critical */
      .stats-critical {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(8px);
        padding: 20px 0;
      }
      
      /* Tools grid critical */
      .tools-grid-critical {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        padding: 48px 0;
      }
      
      .tool-card-critical {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      
      .tool-card-critical:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
      }
      
      /* Layout utilities */
      .container-critical {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 16px;
      }
      
      .text-center-critical {
        text-align: center;
      }
      
      .flex-critical {
        display: flex;
      }
      
      .items-center-critical {
        align-items: center;
      }
      
      .justify-center-critical {
        justify-content: center;
      }
      
      .gap-4-critical {
        gap: 16px;
      }
      
      .mb-6-critical {
        margin-bottom: 24px;
      }
      
      .mb-8-critical {
        margin-bottom: 32px;
      }
      
      /* Loading states */
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .hero-title-critical {
          font-size: 2.5rem;
        }
        
        .tools-grid-critical {
          grid-template-columns: 1fr;
        }
        
        .container-critical {
          padding: 0 12px;
        }
      }
    `;

    // Create and inject critical CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = criticalCSS;
    styleElement.setAttribute('data-critical', 'true');
    
    // Insert at the beginning of head for highest priority
    if (document.head.firstChild) {
      document.head.insertBefore(styleElement, document.head.firstChild);
    } else {
      document.head.appendChild(styleElement);
    }

    // Preload non-critical CSS
    const preloadCSS = () => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = '/styles/non-critical.css';
      link.onload = () => {
        link.onload = null;
        link.rel = 'stylesheet';
      };
      document.head.appendChild(link);
    };

    // Load non-critical CSS after initial render
    const timer = setTimeout(preloadCSS, 100);

    return () => {
      clearTimeout(timer);
      // Clean up critical CSS if component unmounts
      const criticalStyle = document.querySelector('style[data-critical="true"]');
      if (criticalStyle) {
        criticalStyle.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default CriticalCSS;
