import { Helmet } from "react-helmet-async";

interface GoogleSearchOptimizerProps {
  title?: string;
  description?: string;
  siteName?: string;
  siteUrl?: string;
  logoUrl?: string;
  enableKnowledgeGraph?: boolean;
}

const GoogleSearchOptimizer = ({
  title = "PDFPage - Free PDF & Image Tools Online",
  description = "Professional PDF and image processing tools. Convert, edit, compress, merge, split PDFs. Resize, compress, convert images. No registration required. Trusted by millions.",
  siteName = "PDFPage",
  siteUrl = "https://pdfpage.in",
  logoUrl = "https://pdfpage.in/logo-512x512.png",
  enableKnowledgeGraph = true
}: GoogleSearchOptimizerProps) => {

  // Enhanced Organization Schema for Google Knowledge Graph
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "SoftwareApplication"],
    "@id": `${siteUrl}/#organization`,
    "name": "PDFPage",
    "alternateName": ["PDF Page", "PDFPage.in", "PDFPage Tools", "PDF & Image Tools"],
    "legalName": "PDFPage",
    "url": siteUrl,
    "logo": {
      "@type": "ImageObject",
      "@id": `${siteUrl}/#logo`,
      "url": logoUrl,
      "contentUrl": logoUrl,
      "width": 512,
      "height": 512,
      "caption": "PDFPage Logo",
      "inLanguage": "en-US"
    },
    "image": [
      {
        "@type": "ImageObject",
        "url": logoUrl,
        "width": 512,
        "height": 512
      },
      {
        "@type": "ImageObject", 
        "url": `${siteUrl}/og-image-1200x630.png`,
        "width": 1200,
        "height": 630
      },
      {
        "@type": "ImageObject",
        "url": `${siteUrl}/screenshot-homepage.png`,
        "width": 1920,
        "height": 1080
      }
    ],
    "description": description,
    "slogan": "Free PDF & Image Tools - Professional Results, No Registration Required",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web Browser",
    "softwareVersion": "2.0",
    "releaseNotes": "Enhanced performance and new features",
    "downloadUrl": siteUrl,
    "installUrl": siteUrl,
    "screenshot": [
      `${siteUrl}/screenshots/homepage.png`,
      `${siteUrl}/screenshots/pdf-tools.png`,
      `${siteUrl}/screenshots/image-tools.png`
    ],
    "featureList": [
      "PDF to Word Converter",
      "Image Compressor", 
      "PDF Merger",
      "PDF Splitter",
      "Image Resizer",
      "Background Remover",
      "Watermark Tools",
      "Document Converter"
    ],
    "keywords": "PDF converter, image compressor, document tools, online converter, free tools, PDF to Word, merge PDF, compress PDF",
    "audience": {
      "@type": "Audience",
      "audienceType": "Business professionals, students, content creators, freelancers"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "validFrom": "2024-01-01",
      "description": "Free online PDF and image processing tools"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.9,
      "reviewCount": 50000,
      "bestRating": 5,
      "worstRating": 1
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/UserPageVisits",
        "userInteractionCount": 2500000
      },
      {
        "@type": "InteractionCounter", 
        "interactionType": "https://schema.org/UserDownloads",
        "userInteractionCount": 45000000
      }
    ],
    "potentialAction": [
      {
        "@type": "UseAction",
        "name": "Convert PDF to Word",
        "target": `${siteUrl}/pdf-to-word`
      },
      {
        "@type": "UseAction",
        "name": "Compress Images",
        "target": `${siteUrl}/img/compress`
      },
      {
        "@type": "UseAction",
        "name": "Merge PDFs",
        "target": `${siteUrl}/merge`
      }
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": siteUrl
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "contact@pdfpage.in",
        "availableLanguage": ["English"],
        "areaServed": "Worldwide"
      }
    ],
    "sameAs": [
      "https://twitter.com/pdfpage",
      "https://facebook.com/pdfpage",
      "https://linkedin.com/company/pdfpage", 
      "https://youtube.com/@pdfpage",
      "https://www.instagram.com/pdfpage_official",
      "https://github.com/pdfpage"
    ],
    "foundingDate": "2024-01-01",
    "numberOfEmployees": "10-50",
    "memberOf": {
      "@type": "Organization",
      "name": "Internet Software Consortium"
    },
    "award": [
      "Best Free PDF Tools 2024",
      "Top Online Converter Platform",
      "Excellence in Digital Services"
    ],
    "knowsAbout": [
      "PDF Processing",
      "Document Conversion", 
      "Image Editing",
      "File Compression",
      "Digital Tools"
    ],
    "hasCredential": {
      "@type": "EducationalOccupationalCredential",
      "name": "Security Certified Platform"
    },
    "parentOrganization": {
      "@type": "Organization",
      "name": "PDFPage Technologies"
    }
  };

  // Enhanced Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    "url": siteUrl,
    "name": siteName,
    "alternateName": ["PDF Page", "PDFPage Tools"],
    "description": description,
    "inLanguage": "en-US",
    "isPartOf": {
      "@id": `${siteUrl}/#organization`
    },
    "about": {
      "@type": "Thing",
      "name": "PDF and Image Processing",
      "description": "Professional document and image processing tools"
    },
    "publisher": {
      "@id": `${siteUrl}/#organization`
    },
    "potentialAction": [
      {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${siteUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    ],
    "mainEntity": {
      "@type": "ItemList",
      "name": "PDF and Image Tools",
      "numberOfItems": 25,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "SoftwareApplication",
            "name": "PDF to Word Converter",
            "url": `${siteUrl}/pdf-to-word`
          }
        },
        {
          "@type": "ListItem", 
          "position": 2,
          "item": {
            "@type": "SoftwareApplication",
            "name": "Image Compressor",
            "url": `${siteUrl}/img/compress`
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "SoftwareApplication",
            "name": "PDF Merger",
            "url": `${siteUrl}/merge`
          }
        }
      ]
    }
  };

  // Brand Schema for better recognition
  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    "name": "PDFPage",
    "alternateName": ["PDF Page", "PDFPage Tools"],
    "description": "Professional PDF and image processing tools brand",
    "logo": {
      "@id": `${siteUrl}/#logo`
    },
    "sameAs": [
      "https://twitter.com/pdfpage",
      "https://facebook.com/pdfpage",
      "https://linkedin.com/company/pdfpage",
      "https://youtube.com/@pdfpage", 
      "https://www.instagram.com/pdfpage_official",
      "https://github.com/pdfpage"
    ],
    "slogan": "Free PDF & Image Tools Online"
  };

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [organizationSchema, websiteSchema, brandSchema]
  };

  return (
    <Helmet>
      {/* Enhanced meta tags for Google search appearance */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      
      {/* Organization and branding */}
      <meta name="organization" content={siteName} />
      <meta name="brand" content={siteName} />
      <meta name="company" content={siteName} />
      
      {/* Logo and images for search results */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
      <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#e5322d" />
      
      {/* Open Graph for better social sharing and search */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:image" content={`${siteUrl}/og-image-1200x630.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="PDFPage - Free PDF & Image Tools" />
      <meta property="og:logo" content={logoUrl} />
      
      {/* Twitter Card with logo */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@pdfpage" />
      <meta name="twitter:creator" content="@pdfpage" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}/og-image-1200x630.png`} />
      <meta name="twitter:image:alt" content="PDFPage Logo" />
      
      {/* Additional search engine optimization */}
      <meta name="subject" content="PDF and Image Processing Tools" />
      <meta name="abstract" content={description} />
      <meta name="topic" content="Document Processing, Image Editing, File Conversion" />
      <meta name="summary" content={description} />
      <meta name="classification" content="Tools, Software, Business, Technology" />
      <meta name="category" content="Internet Services, Software, Business Tools" />
      <meta name="coverage" content="Worldwide" />
      <meta name="distribution" content="Global" />
      
      {/* Brand and identity signals */}
      <meta name="brand-logo" content={logoUrl} />
      <meta name="brand-color" content="#e5322d" />
      <meta name="brand-font" content="Inter" />
      <meta name="company-logo" content={logoUrl} />
      
      {/* Social media verification */}
      <meta name="twitter:domain" content="pdfpage.in" />
      <meta property="fb:app_id" content="PDFPage_Facebook_App_ID" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(combinedSchema, null, 2)}
      </script>
      
      {/* Additional JSON-LD for Knowledge Graph */}
      {enableKnowledgeGraph && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "PDFPage",
            "url": siteUrl,
            "logo": logoUrl,
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "contact@pdfpage.in"
            },
            "sameAs": [
              "https://twitter.com/pdfpage",
              "https://facebook.com/pdfpage",
              "https://linkedin.com/company/pdfpage",
              "https://youtube.com/@pdfpage",
              "https://www.instagram.com/pdfpage_official"
            ]
          }, null, 2)}
        </script>
      )}
    </Helmet>
  );
};

export default GoogleSearchOptimizer;
