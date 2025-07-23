import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb = ({ items, className = "" }: BreadcrumbProps) => {
  // Generate BreadcrumbList schema for SEO
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.href ? `https://pdfpage.in${item.href}` : undefined
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      
      <nav className={`flex items-center space-x-2 text-sm text-gray-600 mb-6 ${className}`} aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;
            
            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
                
                {isFirst && (
                  <Home className="w-4 h-4 mr-1" />
                )}
                
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="hover:text-blue-600 transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-gray-900 font-semibold" : "text-gray-600"}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

// Helper function to generate breadcrumbs based on current path
export const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" }
  ];

  // Build breadcrumbs based on path
  let currentPath = "";
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Create human-readable labels
    let label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Custom labels for common paths
    const labelMap: Record<string, string> = {
      'img': 'Image Tools',
      'pdf-to-word': 'PDF to Word Converter',
      'compress': 'Image Compressor',
      'merge': 'Merge PDF',
      'split': 'Split PDF',
      'compress-pdf': 'PDF Compressor',
      'favicon': 'Favicon Generator',
      'available-tools': 'All Tools',
      'blog': 'Blog',
      'about': 'About Us',
      'pricing': 'Pricing',
      'contact': 'Contact'
    };
    
    if (labelMap[segment]) {
      label = labelMap[segment];
    }
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      isCurrentPage: isLast
    });
  });

  return breadcrumbs;
};

export default Breadcrumb;
