import { Helmet } from "react-helmet-async";

interface EnhancedSEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  locale?: string;
  alternateLanguages?: Array<{ lang: string; url: string }>;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  articleTags?: string[];
  enableJsonLd?: boolean;
  enableCoreWebVitals?: boolean;
  enableSecurityHeaders?: boolean;
  enablePerformanceHints?: boolean;
}

const EnhancedSEO = ({
  title,
  description,
  keywords = "",
  canonical,
  ogImage = "/og-image-default.jpg",
  locale = "en_US",
  alternateLanguages = [],
  publishedTime,
  modifiedTime,
  author = "PDFPage Team",
  articleTags = [],
  enableJsonLd = true,
  enableCoreWebVitals = true,
  enableSecurityHeaders = true,
  enablePerformanceHints = true,
}: EnhancedSEOProps) => {
  const siteUrl = "https://pdfpage.in";
  const fullTitle = `${title} | PDFPage - Free PDF & Image Tools`;
  const fullUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const fullImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  // Generate additional keywords based on content
  const generateKeywords = () => {
    const baseKeywords = [
      "free online tools",
      "pdf converter",
      "image editor",
      "no registration required",
      "secure processing",
      "fast conversion",
      "professional tools",
      "document processing"
    ];
    
    const allKeywords = [...baseKeywords];
    if (keywords) {
      allKeywords.unshift(...keywords.split(',').map(k => k.trim()));
    }
    
    return allKeywords.join(', ');
  };

  // Security and performance meta tags
  const securityHeaders = enableSecurityHeaders ? [
    { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
    { httpEquiv: "X-Frame-Options", content: "DENY" },
    { httpEquiv: "X-XSS-Protection", content: "1; mode=block" },
    { httpEquiv: "Referrer-Policy", content: "origin-when-cross-origin" },
    { httpEquiv: "Permissions-Policy", content: "geolocation=(), microphone=(), camera=()" }
  ] : [];

  // Performance hints
  const performanceHints = enablePerformanceHints ? [
    { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
    { rel: "dns-prefetch", href: "//fonts.gstatic.com" },
    { rel: "dns-prefetch", href: "//www.googletagmanager.com" },
    { rel: "dns-prefetch", href: "//www.google-analytics.com" },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    { rel: "preload", href: "/fonts/inter-var.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" }
  ] : [];

  // Core Web Vitals optimization
  const coreWebVitalsTags = enableCoreWebVitals ? [
    { name: "google-site-verification", content: "your-google-site-verification-code" },
    { name: "msvalidate.01", content: "your-bing-webmaster-verification-code" },
    { name: "yandex-verification", content: "your-yandex-verification-code" },
    { name: "p:domain_verify", content: "your-pinterest-verification-code" }
  ] : [];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={generateKeywords()} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Enhanced Robots Meta */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="bingbot" content="index, follow" />
      
      {/* Language and Locale */}
      <meta httpEquiv="content-language" content="en" />
      <meta name="language" content="English" />
      
      {/* Author and Publisher */}
      <meta name="author" content={author} />
      <meta name="publisher" content="PDFPage" />
      <meta name="copyright" content="© 2025 PDFPage. All rights reserved." />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="PDFPage" />
      <meta property="og:locale" content={locale} />
      {alternateLanguages.map(alt => (
        <meta key={alt.lang} property="og:locale:alternate" content={alt.lang} />
      ))}
      
      {/* Article-specific Open Graph */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {articleTags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      <meta property="article:author" content={author} />
      <meta property="article:publisher" content="https://facebook.com/pdfpage" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:site" content="@pdfpage" />
      <meta name="twitter:creator" content="@pdfpage" />
      <meta name="twitter:domain" content="pdfpage.in" />
      
      {/* Additional Social Meta Tags */}
      <meta property="fb:app_id" content="your-facebook-app-id" />
      <meta name="pinterest-rich-pin" content="true" />
      
      {/* Mobile and App Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="PDFPage" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="msapplication-TileColor" content="#e5322d" />
      <meta name="msapplication-TileImage" content="/icons/mstile-144x144.png" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="theme-color" content="#e5322d" />
      <meta name="color-scheme" content="light dark" />
      
      {/* Geo Location */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      <meta name="ICBM" content="37.7749, -122.4194" />
      
      {/* Business/Contact Info */}
      <meta name="contact" content="contact@pdfpage.in" />
      <meta name="reply-to" content="contact@pdfpage.in" />
      <meta name="owner" content="PDFPage" />
      <meta name="url" content={siteUrl} />
      <meta name="identifier-URL" content={siteUrl} />
      <meta name="category" content="Technology, Business, Education, Productivity" />
      <meta name="coverage" content="Worldwide" />
      <meta name="distribution" content="Global" />
      <meta name="rating" content="General" />
      
      {/* Content Classification */}
      <meta name="classification" content="Tools, Software, Business" />
      <meta name="subject" content="PDF and Image Processing Tools" />
      <meta name="abstract" content={description} />
      <meta name="topic" content="Document Processing, Image Editing, File Conversion" />
      <meta name="summary" content={description} />
      
      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#e5322d" />
      <link rel="shortcut icon" href="/favicon.ico" />
      
      {/* Web Manifest */}
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Alternate Languages */}
      {alternateLanguages.map(alt => (
        <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={siteUrl} />
      
      {/* RSS/Atom Feeds */}
      <link rel="alternate" type="application/rss+xml" title="PDFPage Blog RSS" href="/feed.xml" />
      <link rel="alternate" type="application/atom+xml" title="PDFPage Blog Atom" href="/atom.xml" />
      
      {/* Security Headers */}
      {securityHeaders.map((header, index) => (
        <meta key={index} httpEquiv={header.httpEquiv} content={header.content} />
      ))}
      
      {/* Performance Hints */}
      {performanceHints.map((hint, index) => (
        <link 
          key={index} 
          rel={hint.rel} 
          href={hint.href} 
          as={hint.as}
          type={hint.type}
          crossOrigin={hint.crossOrigin}
        />
      ))}
      
      {/* Core Web Vitals and Verification */}
      {coreWebVitalsTags.map((tag, index) => (
        <meta key={index} name={tag.name} content={tag.content} />
      ))}
      
      {/* Format Detection */}
      <meta name="format-detection" content="telephone=no, email=no, address=no" />
      
      {/* Cache Control */}
      <meta httpEquiv="Cache-Control" content="public, max-age=31536000" />
      <meta httpEquiv="Expires" content="31536000" />
      
      {/* Generator */}
      <meta name="generator" content="PDFPage Tools Platform v2.0" />
      
      {/* Review and Rating Meta */}
      <meta name="rating" content="5" />
      <meta name="review-count" content="50000+" />
      <meta name="average-rating" content="4.9" />
      
      {/* Business Hours */}
      <meta name="business-hours" content="24/7" />
      <meta name="service-area" content="Global" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="revisit-after" content="1 day" />
      <meta name="expires" content="never" />
      <meta name="pragma" content="no-cache" />
      <meta httpEquiv="imagetoolbar" content="no" />
      <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
      
      {/* Dublin Core Metadata */}
      <meta name="DC.title" content={title} />
      <meta name="DC.description" content={description} />
      <meta name="DC.creator" content={author} />
      <meta name="DC.publisher" content="PDFPage" />
      <meta name="DC.language" content="en" />
      <meta name="DC.rights" content="© 2025 PDFPage. All rights reserved." />
      <meta name="DC.type" content="InteractiveResource" />
      <meta name="DC.format" content="text/html" />
      <meta name="DC.identifier" content={fullUrl} />
      <meta name="DC.coverage" content="Worldwide" />
      
      {/* Page-specific meta tags */}
      <meta name="page-type" content="tool" />
      <meta name="content-type" content="tool-page" />
      <meta name="page-topic" content="document-processing" />
    </Helmet>
  );
};

export default EnhancedSEO;
