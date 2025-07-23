// Advanced SEO Configuration for Maximum Google Rankings
export const SEO_CONFIG = {
  // Core Site Information
  SITE: {
    name: "PDFPage",
    url: "https://pdfpage.in",
    title: "Free PDF & Image Tools Online - Convert, Edit & Optimize",
    description: "Professional PDF and image processing tools. Convert, merge, split, compress PDFs. Resize, compress, edit images. Free, secure, no registration required.",
    keywords: [
      "PDF converter",
      "PDF to Word",
      "merge PDF",
      "split PDF",
      "compress PDF",
      "image compressor",
      "resize image",
      "PDF tools",
      "image tools",
      "online converter",
      "free PDF editor",
      "document converter"
    ],
    language: "en",
    region: "US",
    author: "PDFPage Team",
    publisher: "PDFPage",
    copyright: "© 2025 PDFPage. All rights reserved."
  },

  // Social Media & Branding
  SOCIAL: {
    twitter: "@pdfpage",
    facebook: "https://facebook.com/pdfpage",
    linkedin: "https://linkedin.com/company/pdfpage",
    youtube: "https://youtube.com/@pdfpage",
    instagram: "https://www.instagram.com/pdfpage_official"
  },

  // Business Information for Local SEO
  BUSINESS: {
    type: "TechCompany",
    foundingDate: "2024-01-01",
    email: "contact@pdfpage.in",
    telephone: "+1-555-PDF-PAGE",
    address: {
      streetAddress: "123 Tech Street",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94105",
      addressCountry: "US"
    },
    sameAs: [
      "https://twitter.com/pdfpage",
      "https://facebook.com/pdfpage",
      "https://linkedin.com/company/pdfpage",
      "https://youtube.com/@pdfpage",
      "https://www.instagram.com/pdfpage_official",
      "https://github.com/pdfpage"
    ]
  },

  // Performance & Core Web Vitals
  PERFORMANCE: {
    enablePreload: true,
    enablePrefetch: true,
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCriticalCSS: true,
    enableServiceWorker: true,
    cacheStrategy: "cache-first",
    compressionLevel: "high"
  },

  // Content Strategy for Rankings
  CONTENT: {
    enableBreadcrumbs: true,
    enableRelatedLinks: true,
    enableFAQSchema: true,
    enableHowToSchema: true,
    enableReviewSchema: true,
    enableVideoSchema: false,
    enableBlogSchema: true,
    minContentLength: 300,
    maxContentLength: 2000,
    keywordDensity: 2.5
  },

  // Tool-Specific SEO Settings
  TOOLS: {
    "pdf-to-word": {
      title: "PDF to Word Converter Online - Free, Fast & Accurate",
      description: "Convert PDF to Word (DOCX) online for free. Maintain formatting, fonts, and layout. No signup required. Fast, secure, and accurate PDF to Word conversion.",
      keywords: ["PDF to Word converter", "PDF to DOCX", "convert PDF to Word online", "free PDF converter"],
      rating: 4.9,
      reviewCount: 15420,
      monthlyUsers: 2100000,
      processingTime: "3 seconds",
      features: [
        "Preserve original formatting",
        "Support for tables and images",
        "Batch conversion available",
        "No file size limits",
        "Secure processing",
        "Download immediately"
      ]
    },
    "img-compress": {
      title: "Free Image Compressor Online - Reduce Image Size Without Quality Loss",
      description: "Compress images online for free while maintaining quality. Reduce JPG, PNG, WebP file sizes by up to 90%. Fast, secure compression with real-time preview.",
      keywords: ["image compressor", "compress image online", "reduce image size", "image optimizer"],
      rating: 4.9,
      reviewCount: 8543,
      monthlyUsers: 850000,
      processingTime: "2 seconds",
      features: [
        "Up to 90% size reduction",
        "Real-time preview",
        "Multiple format support",
        "Batch processing",
        "No quality loss",
        "Instant download"
      ]
    },
    "merge-pdf": {
      title: "Merge PDF Files Online - Combine PDFs Free & Secure",
      description: "Merge multiple PDF files into one document online. Free, fast, and secure PDF merger. No registration required. Maintain quality and formatting.",
      keywords: ["merge PDF", "combine PDF", "PDF merger", "join PDF files"],
      rating: 4.8,
      reviewCount: 12300,
      monthlyUsers: 1800000,
      processingTime: "4 seconds"
    }
  },

  // Google Search Console & Analytics
  TRACKING: {
    googleAnalytics: "G-XXXXXXXXXX",
    googleTagManager: "GTM-XXXXXXX",
    googleSearchConsole: "google-site-verification=xxxxxxxxxx",
    bingWebmaster: "xxxxxxxxxx",
    yandexWebmaster: "xxxxxxxxxx",
    enableHeatmaps: true,
    enableUserTracking: true,
    enableConversionTracking: true
  },

  // Schema.org Structured Data
  SCHEMA: {
    organization: {
      "@type": "Organization",
      name: "PDFPage",
      url: "https://pdfpage.in",
      logo: "https://pdfpage.in/logo.png",
      description: "Free online PDF and image tools for converting, editing, and optimizing documents",
      foundingDate: "2024-01-01",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: "English",
        areaServed: "Worldwide"
      }
    },
    website: {
      "@type": "WebSite",
      name: "PDFPage",
      url: "https://pdfpage.in",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://pdfpage.in/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  },

  // International SEO
  INTERNATIONAL: {
    defaultLanguage: "en",
    supportedLanguages: ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"],
    enableHreflang: true,
    enableGeotargeting: true
  },

  // Advanced Ranking Factors
  RANKING_FACTORS: {
    // User Experience Signals
    bounceRateTarget: 25, // Target bounce rate percentage
    sessionDurationTarget: 180, // Target session duration in seconds
    pagesPerSessionTarget: 3.5,
    
    // Technical SEO
    enableAMP: false, // Accelerated Mobile Pages
    enablePWA: true, // Progressive Web App
    enableHTTP2: true,
    enableBrotliCompression: true,
    
    // Content Quality
    readabilityScore: 60, // Flesch Reading Ease score
    contentFreshnessUpdate: 30, // Update content every 30 days
    enableRelatedContent: true,
    enableSimilarTools: true,
    
    // Social Signals
    enableSocialSharing: true,
    enableSocialProof: true,
    enableUserReviews: true,
    enableTestimonials: true,
    
    // Mobile Optimization
    mobileFirstIndexing: true,
    touchTargetSize: 44, // Minimum touch target size in pixels
    viewportOptimization: true,
    
    // Page Speed (Core Web Vitals)
    LCP_target: 2.5, // Largest Contentful Paint (seconds)
    FID_target: 100, // First Input Delay (milliseconds)
    CLS_target: 0.1, // Cumulative Layout Shift
    
    // Security
    enableHTTPS: true,
    enableSecurityHeaders: true,
    enableCSP: true, // Content Security Policy
    
    // Accessibility
    enableA11y: true,
    contrastRatio: 4.5,
    enableScreenReader: true,
    enableKeyboardNavigation: true
  },

  // Competitor Analysis Keywords
  COMPETITOR_KEYWORDS: [
    // Primary competitors
    "smallpdf alternative",
    "ilovepdf alternative", 
    "lightpdf alternative",
    "sejda alternative",
    "sodapdf alternative",
    
    // Long-tail keywords
    "best free PDF converter",
    "online PDF tools without watermark",
    "free PDF editor no registration",
    "compress PDF without losing quality",
    "convert PDF to Word free online",
    "merge PDF files free",
    "split PDF pages online",
    "resize image without quality loss",
    "compress image for web",
    "JPG to PNG converter free"
  ],

  // Local SEO (if applicable)
  LOCAL_SEO: {
    enableLocalBusiness: false,
    businessHours: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59"
    }
  }
};

// Export specific configurations
export const getToolSEO = (toolSlug: string) => {
  return SEO_CONFIG.TOOLS[toolSlug] || null;
};

export const getSchemaForTool = (toolName: string, toolUrl: string) => {
  const toolConfig = getToolSEO(toolUrl.replace('/', ''));
  
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: toolName,
    url: `${SEO_CONFIG.SITE.url}${toolUrl}`,
    description: toolConfig?.description || SEO_CONFIG.SITE.description,
    operatingSystem: "Web Browser",
    applicationCategory: "UtilityApplication",
    aggregateRating: toolConfig ? {
      "@type": "AggregateRating",
      ratingValue: toolConfig.rating,
      reviewCount: toolConfig.reviewCount,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock"
    }
  };
};

export default SEO_CONFIG;
