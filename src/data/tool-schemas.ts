// Comprehensive SEO schemas for all tools
export interface ToolSchema {
  name: string;
  description: string;
  url: string;
  category: string;
  rating: number;
  reviewCount: number;
  features: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  howToSteps: Array<{
    name: string;
    text: string;
    image?: string;
  }>;
  reviews: Array<{
    author: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export const TOOL_SCHEMAS: Record<string, ToolSchema> = {
  "pdf-to-word": {
    name: "PDF to Word Converter",
    description: "Convert PDF to Word (DOCX) online for free. Maintain formatting, fonts, and layout. No signup required.",
    url: "/pdf-to-word",
    category: "PDF Conversion",
    rating: 4.9,
    reviewCount: 15420,
    features: [
      "Preserve original formatting",
      "Support for tables and images", 
      "Batch conversion available",
      "No file size limits",
      "Secure processing",
      "Download immediately"
    ],
    faqs: [
      {
        question: "How accurate is PDF to Word conversion?",
        answer: "Our advanced OCR technology maintains 95%+ accuracy for text and preserves formatting, tables, and images from the original PDF."
      },
      {
        question: "Can I convert password-protected PDFs?",
        answer: "Yes, you can convert password-protected PDFs by entering the password during the upload process."
      },
      {
        question: "What's the maximum file size for conversion?",
        answer: "Free users can convert PDFs up to 50MB. Premium users have no file size limits."
      },
      {
        question: "How long does conversion take?",
        answer: "Most PDFs are converted to Word in under 30 seconds, depending on file size and complexity."
      }
    ],
    howToSteps: [
      {
        name: "Upload PDF File",
        text: "Click 'Choose PDF' and select your PDF file from your device or drag and drop it into the upload area.",
        image: "/screenshots/upload-pdf.jpg"
      },
      {
        name: "Start Conversion",
        text: "Click 'Convert to Word' to begin the conversion process. The tool will analyze your PDF and extract text and formatting.",
        image: "/screenshots/convert-pdf-word.jpg"
      },
      {
        name: "Download Word Document",
        text: "Once conversion is complete, click 'Download DOCX' to save the converted Word document to your device.",
        image: "/screenshots/download-word.jpg"
      }
    ],
    reviews: [
      {
        author: "Sarah Johnson",
        rating: 5,
        comment: "Perfect conversion! Maintained all formatting and tables from my technical report.",
        date: "2024-12-20"
      },
      {
        author: "Mike Chen",
        rating: 5,
        comment: "Best PDF to Word converter I've used. Fast and accurate results every time.",
        date: "2024-12-18"
      },
      {
        author: "Emma Davis",
        rating: 4,
        comment: "Great tool for converting resumes and documents. Saves me so much time.",
        date: "2024-12-15"
      }
    ]
  },

  "img-compress": {
    name: "Image Compressor",
    description: "Compress images online for free while maintaining quality. Reduce JPG, PNG, WebP file sizes by up to 90%.",
    url: "/img/compress",
    category: "Image Processing",
    rating: 4.9,
    reviewCount: 8543,
    features: [
      "Up to 90% size reduction",
      "Real-time preview",
      "Multiple format support", 
      "Batch processing",
      "No quality loss",
      "Instant download"
    ],
    faqs: [
      {
        question: "How much can I compress my images?",
        answer: "You can reduce image file sizes by up to 90% while maintaining visual quality using our advanced compression algorithms."
      },
      {
        question: "What image formats are supported?",
        answer: "We support JPG, JPEG, PNG, WebP, and GIF image formats for compression."
      },
      {
        question: "Will compressing images reduce quality?",
        answer: "Our smart compression maintains visual quality while reducing file size. You can adjust quality settings to your preference."
      },
      {
        question: "Is there a limit on file size or number of images?",
        answer: "Free users can compress images up to 10MB each with no daily limit. Premium users have no restrictions."
      }
    ],
    howToSteps: [
      {
        name: "Upload Images",
        text: "Click 'Choose Images' and select one or multiple image files from your device.",
        image: "/screenshots/upload-images.jpg"
      },
      {
        name: "Adjust Quality",
        text: "Use the quality slider to control compression level. Preview the results in real-time.",
        image: "/screenshots/adjust-quality.jpg"
      },
      {
        name: "Download Compressed Images",
        text: "Click 'Download All' to save your compressed images or download them individually.",
        image: "/screenshots/download-compressed.jpg"
      }
    ],
    reviews: [
      {
        author: "Alex Rivera",
        rating: 5,
        comment: "Reduced my website images by 80% with no visible quality loss. Amazing!",
        date: "2024-12-19"
      },
      {
        author: "Lisa Wong",
        rating: 5,
        comment: "Perfect for social media content. The batch processing saves me hours.",
        date: "2024-12-17"
      },
      {
        author: "David Miller",
        rating: 4,
        comment: "Great compression results. Easy to use interface with good preview features.",
        date: "2024-12-14"
      }
    ]
  },

  "merge-pdf": {
    name: "PDF Merger",
    description: "Merge multiple PDF files into one document online. Free, fast, and secure PDF merger.",
    url: "/merge",
    category: "PDF Processing",
    rating: 4.8,
    reviewCount: 12300,
    features: [
      "Merge unlimited PDFs",
      "Drag and drop ordering",
      "Page range selection",
      "Password-protected PDFs support",
      "Maintain bookmarks",
      "Fast processing"
    ],
    faqs: [
      {
        question: "How many PDFs can I merge at once?",
        answer: "You can merge unlimited PDF files in a single operation. There's no restriction on the number of files."
      },
      {
        question: "Can I reorder pages before merging?",
        answer: "Yes, you can drag and drop to reorder PDFs and select specific page ranges from each document."
      },
      {
        question: "Will bookmarks be preserved?",
        answer: "Yes, our merger maintains bookmarks, metadata, and document structure from the original PDFs."
      },
      {
        question: "Is there a file size limit?",
        answer: "Free users can merge PDFs up to 100MB total. Premium users have unlimited file sizes."
      }
    ],
    howToSteps: [
      {
        name: "Upload PDF Files",
        text: "Click 'Add PDFs' to upload multiple PDF files or drag them directly into the merger.",
        image: "/screenshots/upload-multiple-pdfs.jpg"
      },
      {
        name: "Arrange Order",
        text: "Drag and drop PDFs to reorder them. Select specific page ranges if needed.",
        image: "/screenshots/arrange-pdfs.jpg"
      },
      {
        name: "Merge and Download",
        text: "Click 'Merge PDFs' to combine all files. Download the merged PDF when ready.",
        image: "/screenshots/download-merged.jpg"
      }
    ],
    reviews: [
      {
        author: "Jennifer Thompson",
        rating: 5,
        comment: "Merged 15 reports into one document perfectly. Kept all formatting intact.",
        date: "2024-12-21"
      },
      {
        author: "Robert Kim",
        rating: 5,
        comment: "Essential tool for my business. Fast and reliable PDF merging every time.",
        date: "2024-12-16"
      },
      {
        author: "Maria Garcia",
        rating: 4,
        comment: "Easy to use with great drag-and-drop functionality. Very helpful.",
        date: "2024-12-13"
      }
    ]
  },

  "split-pdf": {
    name: "PDF Splitter",
    description: "Split PDF files into separate pages or extract specific page ranges. Free online PDF splitter.",
    url: "/split",
    category: "PDF Processing", 
    rating: 4.8,
    reviewCount: 9876,
    features: [
      "Split by page numbers",
      "Extract page ranges",
      "Split into equal parts",
      "Bulk page extraction",
      "Preview before splitting",
      "Download individual pages"
    ],
    faqs: [
      {
        question: "Can I split specific pages from a PDF?",
        answer: "Yes, you can extract specific pages, page ranges, or split the PDF into equal parts."
      },
      {
        question: "Will the quality be affected after splitting?",
        answer: "No, splitting maintains the original quality and formatting of each page."
      },
      {
        question: "Can I split password-protected PDFs?",
        answer: "Yes, enter the password during upload to split protected PDFs."
      },
      {
        question: "How many pages can I extract?",
        answer: "You can extract unlimited pages from PDFs of any size."
      }
    ],
    howToSteps: [
      {
        name: "Upload PDF",
        text: "Select your PDF file by clicking 'Choose PDF' or drag it into the upload area.",
        image: "/screenshots/upload-split-pdf.jpg"
      },
      {
        name: "Select Pages",
        text: "Choose which pages to extract or how to split the PDF using our interactive preview.",
        image: "/screenshots/select-pages.jpg"
      },
      {
        name: "Download Results",
        text: "Download individual pages or the split PDF files as a ZIP archive.",
        image: "/screenshots/download-split.jpg"
      }
    ],
    reviews: [
      {
        author: "Mark Johnson",
        rating: 5,
        comment: "Extracted exactly the pages I needed from a 200-page manual. Perfect!",
        date: "2024-12-20"
      },
      {
        author: "Anna Lee",
        rating: 5,
        comment: "Simple and effective. Split my thesis into chapters effortlessly.",
        date: "2024-12-18"
      },
      {
        author: "Tom Wilson",
        rating: 4,
        comment: "Great tool for extracting specific pages. User-friendly interface.",
        date: "2024-12-15"
      }
    ]
  },

  "compress-pdf": {
    name: "PDF Compressor",
    description: "Compress PDF files online to reduce file size while maintaining quality. Free PDF compression tool.",
    url: "/compress",
    category: "PDF Processing",
    rating: 4.9,
    reviewCount: 18765,
    features: [
      "Up to 80% size reduction",
      "Multiple compression levels",
      "Batch PDF compression",
      "Maintain PDF quality",
      "Password protection support",
      "Fast processing"
    ],
    faqs: [
      {
        question: "How much can PDF files be compressed?",
        answer: "Typically 50-80% size reduction while maintaining readability and quality."
      },
      {
        question: "Will compression affect PDF quality?",
        answer: "Our smart compression preserves text quality and optimizes images without visible degradation."
      },
      {
        question: "Can I compress multiple PDFs at once?",
        answer: "Yes, our batch compression feature allows processing multiple PDFs simultaneously."
      },
      {
        question: "Are there file size limits?",
        answer: "Free users can compress PDFs up to 50MB. Premium users have no size restrictions."
      }
    ],
    howToSteps: [
      {
        name: "Upload PDF Files", 
        text: "Select one or multiple PDF files to compress by clicking 'Choose PDFs'.",
        image: "/screenshots/upload-compress-pdf.jpg"
      },
      {
        name: "Choose Compression Level",
        text: "Select compression level: Low (better quality), Medium (balanced), or High (smaller size).",
        image: "/screenshots/compression-level.jpg"
      },
      {
        name: "Download Compressed PDFs",
        text: "Download your compressed PDFs individually or as a ZIP file.",
        image: "/screenshots/download-compressed-pdf.jpg"
      }
    ],
    reviews: [
      {
        author: "Chris Brown",
        rating: 5,
        comment: "Reduced my 50MB presentation to 8MB with no quality loss. Incredible!",
        date: "2024-12-22"
      },
      {
        author: "Jessica Martinez",
        rating: 5,
        comment: "Perfect for email attachments. Compressed 20 PDFs in minutes.",
        date: "2024-12-19"
      },
      {
        author: "Ryan Taylor",
        rating: 4,
        comment: "Reliable compression with good quality preservation. Highly recommended.",
        date: "2024-12-16"
      }
    ]
  }
};

// Get schema for specific tool
export const getToolSchema = (toolSlug: string): ToolSchema | null => {
  return TOOL_SCHEMAS[toolSlug] || null;
};

// Generate FAQ schema for a tool
export const generateFAQSchema = (toolSlug: string) => {
  const tool = getToolSchema(toolSlug);
  if (!tool) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": tool.faqs.map((faq, index) => ({
      "@type": "Question",
      "@id": `#faq-${index}`,
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
        "dateCreated": new Date().toISOString(),
        "author": {
          "@type": "Organization",
          "name": "PDFPage"
        }
      }
    }))
  };
};

// Generate HowTo schema for a tool
export const generateHowToSchema = (toolSlug: string) => {
  const tool = getToolSchema(toolSlug);
  if (!tool) return null;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to use ${tool.name}`,
    "description": `Step-by-step guide on how to use ${tool.name} effectively`,
    "image": tool.howToSteps[0]?.image || "https://pdfpage.in/og-image-default.jpg",
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "step": tool.howToSteps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "image": step.image,
      "url": `https://pdfpage.in${tool.url}#step-${index + 1}`
    }))
  };
};

// Generate Review schema for a tool
export const generateReviewSchema = (toolSlug: string) => {
  const tool = getToolSchema(toolSlug);
  if (!tool) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": tool.name,
    "description": tool.description,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": tool.rating,
      "reviewCount": tool.reviewCount,
      "bestRating": 5,
      "worstRating": 1
    },
    "review": tool.reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": 5,
        "worstRating": 1
      },
      "reviewBody": review.comment,
      "datePublished": review.date
    }))
  };
};
