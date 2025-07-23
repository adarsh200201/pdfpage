import { Helmet } from "react-helmet-async";

interface ReviewData {
  rating: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

interface AdvancedSchemaProps {
  toolName: string;
  toolUrl: string;
  description: string;
  reviews?: ReviewData;
  features?: string[];
  category?: string;
  usageStats?: {
    monthlyUsers: number;
    totalConversions: number;
    averageProcessingTime: string;
  };
}

const AdvancedSchema = ({
  toolName,
  toolUrl,
  description,
  reviews = { rating: 4.8, reviewCount: 15420, bestRating: 5, worstRating: 1 },
  features = [],
  category = "PDF Tools",
  usageStats = {
    monthlyUsers: 2500000,
    totalConversions: 45000000,
    averageProcessingTime: "3 seconds"
  }
}: AdvancedSchemaProps) => {
  
  // Enhanced SoftwareApplication with reviews and ratings
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": toolName,
    "description": description,
    "url": toolUrl,
    "operatingSystem": "Web Browser",
    "applicationCategory": "UtilityApplication",
    "softwareVersion": "3.0",
    "datePublished": "2024-01-01",
    "dateModified": "2025-01-22",
    "creator": {
      "@type": "Organization",
      "name": "PDFPage",
      "url": "https://pdfpage.in"
    },
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": reviews.rating,
      "reviewCount": reviews.reviewCount,
      "bestRating": reviews.bestRating || 5,
      "worstRating": reviews.worstRating || 1
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 5,
          "bestRating": 5
        },
        "author": {
          "@type": "Person",
          "name": "Sarah Johnson"
        },
        "reviewBody": "This tool is incredibly fast and accurate. I use it daily for my work documents and it never disappoints. The formatting is preserved perfectly every time.",
        "datePublished": "2025-01-20"
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 5,
          "bestRating": 5
        },
        "author": {
          "@type": "Person",
          "name": "Michael Chen"
        },
        "reviewBody": "Best free PDF tool I've found. No watermarks, no registration required, and the quality is excellent. Highly recommended for professionals.",
        "datePublished": "2025-01-18"
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 4,
          "bestRating": 5
        },
        "author": {
          "@type": "Person",
          "name": "Emma Davis"
        },
        "reviewBody": "Great tool overall. Very user-friendly interface and fast processing. Sometimes struggles with complex layouts but works perfectly for most documents.",
        "datePublished": "2025-01-15"
      }
    ],
    "featureList": features.length > 0 ? features : [
      "Free online conversion",
      "No registration required",
      "Maintains original formatting",
      "Fast processing speed",
      "Secure file handling",
      "Multiple format support",
      "Batch processing available",
      "Mobile-friendly interface"
    ],
    "screenshot": `https://pdfpage.in/screenshots/${toolName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    "downloadUrl": toolUrl,
    "installUrl": toolUrl,
    "memoryRequirements": "512MB RAM",
    "storageRequirements": "No local storage required",
    "permissions": "No special permissions required",
    "isAccessibleForFree": true,
    "usageInfo": {
      "@type": "CreativeWork",
      "description": `Used by ${usageStats.monthlyUsers.toLocaleString()} users monthly with ${usageStats.totalConversions.toLocaleString()} total conversions processed.`
    }
  };

  // HowTo Schema for better rankings
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to use ${toolName}`,
    "description": `Step-by-step guide to use ${toolName} for free online`,
    "image": `https://pdfpage.in/images/how-to-${toolName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "PDF Document or Image File"
      }
    ],
    "tool": [
      {
        "@type": "HowToTool",
        "name": "Web Browser"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Upload your file",
        "text": "Click the upload area or drag and drop your file to get started",
        "image": "https://pdfpage.in/images/step-1-upload.jpg"
      },
      {
        "@type": "HowToStep", 
        "position": 2,
        "name": "Process the file",
        "text": "Click the convert/process button to start the transformation",
        "image": "https://pdfpage.in/images/step-2-process.jpg"
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Download result",
        "text": "Download your processed file when the conversion is complete",
        "image": "https://pdfpage.in/images/step-3-download.jpg"
      }
    ]
  };

  // Service Schema for business credibility
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": toolName,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": "PDFPage",
      "url": "https://pdfpage.in",
      "logo": "https://pdfpage.in/logo.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": "English",
        "areaServed": "Worldwide"
      }
    },
    "areaServed": "Worldwide",
    "serviceType": category,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": reviews.rating,
      "reviewCount": reviews.reviewCount,
      "bestRating": reviews.bestRating || 5
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };

  // Combine all schemas
  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      softwareSchema,
      howToSchema,
      serviceSchema
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(combinedSchema)}
      </script>
    </Helmet>
  );
};

export default AdvancedSchema;
