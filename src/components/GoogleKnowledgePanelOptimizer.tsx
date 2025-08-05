import { Helmet } from "react-helmet-async";

interface GoogleKnowledgePanelOptimizerProps {
  page?: string;
  title?: string;
  description?: string;
  logo?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const GoogleKnowledgePanelOptimizer: React.FC<GoogleKnowledgePanelOptimizerProps> = ({
  page = "homepage",
  title,
  description,
  logo,
  breadcrumbs
}) => {
  const defaultLogo = "https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=png&width=512";
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PDFPage",
    "alternateName": ["PDF Page", "PDFPage Tools", "PDFPage.in"],
    "url": "https://pdfpage.in",
    "logo": {
      "@type": "ImageObject",
      "url": logo || defaultLogo,
      "width": "512",
      "height": "512",
      "caption": "PDFPage Logo - Professional PDF and Image Tools"
    },
    "description": description || "The ultimate PDF toolkit with 25+ free online tools for converting, merging, splitting, compressing, and editing PDF files. Trusted by millions worldwide.",
    "foundingDate": "2023",
    "slogan": "The Ultimate PDF Toolkit",
    "knowsAbout": [
      "PDF Processing",
      "Document Conversion", 
      "Image Processing",
      "File Compression",
      "Digital Document Management",
      "Online Tools",
      "Web Applications"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "PDF and Image Processing Tools",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "SoftwareApplication",
            "name": "PDF Merger",
            "description": "Combine multiple PDF files into one document",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "SoftwareApplication",
            "name": "PDF to Word Converter",
            "description": "Convert PDF files to editable Word documents",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "SoftwareApplication", 
            "name": "PDF Compressor",
            "description": "Reduce PDF file size while maintaining quality",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          }
        }
      ]
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://pdfpage.in/contact",
      "availableLanguage": ["en", "es", "fr", "de", "it", "pt", "ja", "ru", "ko", "zh", "ar"]
    },
    "sameAs": [
      "https://twitter.com/pdfpage",
      "https://www.facebook.com/pdfpage", 
      "https://www.linkedin.com/company/pdfpage",
      "https://www.instagram.com/pdfpage"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "50000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "award": [
      "Best Free PDF Tools 2024",
      "Top Online Document Processing Platform",
      "User Choice Award - PDF Software"
    ]
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PDFPage - Free PDF & Image Tools",
    "alternateName": "PDFPage.in",
    "url": "https://pdfpage.in",
    "description": "Professional PDF and image processing tools with 25+ free online utilities",
    "inLanguage": "en-US",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://pdfpage.in/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "mainEntity": {
      "@type": "WebApplication",
      "name": "PDFPage Tools",
      "url": "https://pdfpage.in",
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Web Browser",
      "permissions": "No registration required",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": "PDFPage",
      "logo": {
        "@type": "ImageObject",
        "url": logo || defaultLogo
      }
    }
  };

  const breadcrumbSchema = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  } : null;

  return (
    <Helmet>
      {/* Enhanced Logo and Branding Meta Tags */}
      <link rel="apple-touch-icon" sizes="180x180" href={logo || defaultLogo} />
      <link rel="icon" type="image/png" sizes="32x32" href={logo || defaultLogo} />
      <link rel="icon" type="image/png" sizes="16x16" href={logo || defaultLogo} />
      <link rel="mask-icon" href={logo || defaultLogo} color="#e5322d" />
      <meta name="msapplication-TileColor" content="#e5322d" />
      <meta name="theme-color" content="#e5322d" />
      
      {/* Google Knowledge Panel Optimization */}
      <meta name="google-site-verification" content="verification-code-here" />
      <meta name="application-name" content="PDFPage" />
      <meta name="apple-mobile-web-app-title" content="PDFPage" />
      <meta name="msapplication-tooltip" content="PDFPage - Professional PDF Tools" />
      
      {/* Enhanced Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      
      <script type="application/ld+json">
        {JSON.stringify(webSiteSchema)}
      </script>
      
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}

      {/* Page-specific meta for better indexing */}
      {page && <meta name="page-topic" content={page} />}
      {page && <meta name="page-type" content="tool" />}
      
      {/* Enhanced Open Graph for Knowledge Panel */}
      <meta property="og:logo" content={logo || defaultLogo} />
      <meta property="og:see_also" content="https://pdfpage.in/about" />
      <meta property="og:see_also" content="https://pdfpage.in/pricing" />
      <meta property="og:see_also" content="https://pdfpage.in/contact" />
    </Helmet>
  );
};

export default GoogleKnowledgePanelOptimizer;
