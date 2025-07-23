import { Helmet } from "react-helmet-async";
import { getToolSchema, generateFAQSchema, generateHowToSchema, generateReviewSchema } from "@/data/tool-schemas";

interface ToolSEOProps {
  toolSlug: string;
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string;
  additionalSchemas?: object[];
}

const ToolSEO = ({
  toolSlug,
  customTitle,
  customDescription,
  customKeywords,
  additionalSchemas = []
}: ToolSEOProps) => {
  const toolSchema = getToolSchema(toolSlug);
  
  if (!toolSchema) {
    return null;
  }

  const siteUrl = "https://pdfpage.in";
  const title = customTitle || `${toolSchema.name} - Free Online Tool | PDFPage`;
  const description = customDescription || toolSchema.description;
  const keywords = customKeywords || `${toolSchema.name.toLowerCase()}, ${toolSchema.category.toLowerCase()}, free online tool, ${toolSlug.replace('-', ' ')}`;
  const fullUrl = `${siteUrl}${toolSchema.url}`;

  // Generate all schemas
  const faqSchema = generateFAQSchema(toolSlug);
  const howToSchema = generateHowToSchema(toolSlug);
  const reviewSchema = generateReviewSchema(toolSlug);

  // Software Application Schema
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${fullUrl}#software`,
    "name": toolSchema.name,
    "alternateName": [
      toolSchema.name.replace(/\s+/g, ''),
      `${toolSchema.name} Online`,
      `Free ${toolSchema.name}`
    ],
    "url": fullUrl,
    "description": toolSchema.description,
    "applicationCategory": "UtilityApplication",
    "applicationSubCategory": toolSchema.category,
    "operatingSystem": ["Web Browser", "Cross-platform"],
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "isAccessibleForFree": true,
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "PDFPage",
        "url": siteUrl
      }
    },
    "featureList": toolSchema.features,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": toolSchema.rating,
      "reviewCount": toolSchema.reviewCount,
      "bestRating": 5,
      "worstRating": 1
    },
    "screenshot": [
      `${siteUrl}/screenshots/${toolSlug}-1.jpg`,
      `${siteUrl}/screenshots/${toolSlug}-2.jpg`
    ],
    "softwareVersion": "2.0.0",
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "creator": {
      "@type": "Organization",
      "name": "PDFPage",
      "url": siteUrl
    },
    "publisher": {
      "@type": "Organization", 
      "name": "PDFPage",
      "url": siteUrl
    }
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Tools",
        "item": `${siteUrl}/available-tools`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": toolSchema.name,
        "item": fullUrl
      }
    ]
  };

  // Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    "url": siteUrl,
    "name": "PDFPage",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    "name": "PDFPage",
    "url": siteUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${siteUrl}/logo.png`
    },
    "sameAs": [
      "https://twitter.com/pdfpage",
      "https://facebook.com/pdfpage",
      "https://linkedin.com/company/pdfpage"
    ]
  };

  // Combine all schemas
  const allSchemas = [
    organizationSchema,
    websiteSchema,
    softwareSchema,
    breadcrumbSchema,
    ...(faqSchema ? [faqSchema] : []),
    ...(howToSchema ? [howToSchema] : []),
    ...(reviewSchema ? [reviewSchema] : []),
    ...additionalSchemas
  ];

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": allSchemas
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Enhanced Robots */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${siteUrl}/og-images/${toolSlug}.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="PDFPage" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}/og-images/${toolSlug}.jpg`} />
      <meta name="twitter:site" content="@pdfpage" />
      
      {/* Tool-specific meta */}
      <meta name="tool-category" content={toolSchema.category} />
      <meta name="tool-rating" content={toolSchema.rating.toString()} />
      <meta name="tool-reviews" content={toolSchema.reviewCount.toString()} />
      <meta name="tool-features" content={toolSchema.features.join(', ')} />
      
      {/* Performance & Core Web Vitals */}
      <meta name="page-priority" content="high" />
      <meta name="loading-strategy" content="eager" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(combinedSchema, null, 2)}
      </script>
    </Helmet>
  );
};

export default ToolSEO;
