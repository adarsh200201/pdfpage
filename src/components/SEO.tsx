import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  schemaData?: object;
  toolName?: string;
  toolType?: "pdf" | "image" | "favicon";
  isFreeTool?: boolean;
}

const SEO = ({
  title,
  description,
  keywords = "",
  canonical,
  ogImage = "/og-image-default.jpg",
  schemaData,
  toolName,
  toolType,
  isFreeTool = true,
}: SEOProps) => {
  const siteUrl = "https://pdfpage.in";
  const fullTitle = `${title} | PDFPage - Free PDF & Image Tools`;
  const fullUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;

  // Default schema for SoftwareApplication
  const defaultToolSchema = toolName ? {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": toolName,
    "operatingSystem": "Web Browser",
    "applicationCategory": "UtilityApplication",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "provider": {
      "@type": "Organization",
      "name": "PDFPage",
      "url": "https://pdfpage.in"
    },
    "url": fullUrl,
    "description": description,
    "featureList": getFeatureList(toolType),
    "screenshot": `${siteUrl}/screenshots/${toolName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    "softwareVersion": "2.0",
    "datePublished": "2024-01-01",
    "dateModified": "2025-01-22",
    "isAccessibleForFree": isFreeTool,
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "permissions": "No special permissions required"
  } : null;

  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PDFPage",
    "url": "https://pdfpage.in",
    "logo": `${siteUrl}/logo.png`,
    "description": "Free online PDF and image tools for converting, editing, and optimizing documents",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://twitter.com/pdfpage",
      "https://facebook.com/pdfpage",
      "https://linkedin.com/company/pdfpage"
    ]
  };

  // Website schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": siteUrl,
    "name": "PDFPage",
    "description": "Free online PDF and image tools",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema,
      websiteSchema,
      ...(defaultToolSchema ? [defaultToolSchema] : []),
      ...(schemaData ? [schemaData] : [])
    ]
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="PDFPage" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      <meta name="twitter:site" content="@pdfpage" />
      <meta name="twitter:creator" content="@pdfpage" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="author" content="PDFPage" />
      <meta name="generator" content="PDFPage Tools" />
      <meta name="theme-color" content="#e5322d" />
      <meta name="msapplication-TileColor" content="#e5322d" />

      {/* Mobile & PWA Optimization Tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="PDFPage" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="msapplication-TileImage" content="/icons/mstile-144x144.png" />
      <meta name="msapplication-config" content="/browserconfig.xml" />

      {/* Security & Performance */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="referrer" content="origin-when-cross-origin" />

      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(combinedSchema)}
      </script>
    </Helmet>
  );
};

// Helper function to get feature list based on tool type
function getFeatureList(toolType?: string): string[] {
  switch (toolType) {
    case "pdf":
      return [
        "Convert PDF to Word, Excel, PowerPoint",
        "Merge multiple PDF files",
        "Split PDF into separate pages",
        "Compress PDF files",
        "Add password protection",
        "Remove PDF passwords",
        "Edit PDF text and images",
        "Add page numbers and watermarks"
      ];
    case "image":
      return [
        "Compress images without quality loss",
        "Resize images to any dimension",
        "Convert between image formats",
        "Crop and rotate images",
        "Remove image backgrounds",
        "Add text watermarks",
        "Batch process multiple images"
      ];
    case "favicon":
      return [
        "Generate favicons from images",
        "Create favicons from text",
        "Generate emoji favicons",
        "Multiple size outputs",
        "Download as ICO, PNG formats",
        "Web manifest generation"
      ];
    default:
      return [
        "Free online tools",
        "No registration required",
        "Secure file processing",
        "Fast conversion",
        "High-quality output"
      ];
  }
}

export default SEO;
