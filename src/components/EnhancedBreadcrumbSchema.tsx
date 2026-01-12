import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

const EnhancedBreadcrumbSchema: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      {
        name: "Home",
        url: "https://pdfpage.in/",
        position: 1
      }
    ];

    const pathSegments = path.split('/').filter(segment => segment !== '');
    
    if (pathSegments.length === 0) {
      return breadcrumbs; // Just homepage
    }

    // Build breadcrumb path
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      let name = segment;
      let category = "";

      // Map path segments to readable names
      switch (segment) {
        case 'img':
          name = "Image Tools";
          category = "Tools";
          break;
        case 'favicon':
          name = "Favicon Generator";
          category = "Tools";
          break;
        case 'merge':
          name = "Merge PDF";
          category = "PDF Tools";
          break;
        case 'split':
          name = "Split PDF";
          category = "PDF Tools";
          break;
        case 'compress':
          name = "Compress PDF";
          category = "PDF Tools";
          break;
        case 'pdf-to-word':
          name = "PDF to Word";
          category = "Conversion Tools";
          break;
        case 'word-to-pdf':
          name = "Word to PDF";
          category = "Conversion Tools";
          break;
        case 'pdf-to-jpg':
          name = "PDF to JPG";
          category = "Conversion Tools";
          break;
        case 'jpg-to-pdf':
          name = "JPG to PDF";
          category = "Conversion Tools";
          break;
        case 'pdf-to-powerpoint':
          name = "PDF to PowerPoint";
          category = "Conversion Tools";
          break;
        case 'powerpoint-to-pdf':
          name = "PowerPoint to PDF";
          category = "Conversion Tools";
          break;
        case 'pdf-to-excel':
          name = "PDF to Excel";
          category = "Conversion Tools";
          break;
        case 'excel-to-pdf':
          name = "Excel to PDF";
          category = "Conversion Tools";
          break;
        case 'edit-pdf':
          name = "Edit PDF";
          category = "PDF Editor";
          break;
        case 'protect-pdf':
          name = "Protect PDF";
          category = "Security Tools";
          break;
        case 'unlock-pdf':
          name = "Unlock PDF";
          category = "Security Tools";
          break;
        case 'rotate':
        case 'rotate-pdf':
          name = "Rotate PDF";
          category = "PDF Tools";
          break;
        case 'crop-pdf':
          name = "Crop PDF";
          category = "PDF Tools";
          break;
        case 'remove-bg':
          name = "Remove Background";
          category = "Image Tools";
          break;
        case 'resize':
          name = "Resize Image";
          category = "Image Tools";
          break;
        case 'jpg-to-png':
          name = "JPG to PNG";
          category = "Image Tools";
          break;
        case 'png-to-jpg':
          name = "PNG to JPG";
          category = "Image Tools";
          break;
        case 'image-to-favicon':
          name = "Image to Favicon";
          category = "Favicon Tools";
          break;
        case 'text-to-favicon':
          name = "Text to Favicon";
          category = "Favicon Tools";
          break;
        case 'emoji-to-favicon':
          name = "Emoji to Favicon";
          category = "Favicon Tools";
          break;
        case 'logo-to-favicon':
          name = "Logo to Favicon";
          category = "Favicon Tools";
          break;
        case 'about':
          name = "About Us";
          category = "Company";
          break;
        case 'pricing':
          name = "Pricing";
          category = "Plans";
          break;
        case 'contact':
          name = "Contact Us";
          category = "Support";
          break;
        case 'blog':
          name = "Blog";
          category = "Content";
          break;
        case 'privacy':
          name = "Privacy Policy";
          category = "Legal";
          break;
        case 'terms':
          name = "Terms of Service";
          category = "Legal";
          break;
        case 'security':
          name = "Security";
          category = "Trust";
          break;
        default:
          // Convert kebab-case to title case
          name = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }

      // Add category if this is a subcategory
      if (index === 0 && pathSegments.length > 1) {
        if (segment === 'img') {
          breadcrumbs.push({
            name: "Image Tools",
            url: `https://pdfpage.in${currentPath}`,
            position: breadcrumbs.length + 1
          });
        } else if (segment === 'favicon') {
          breadcrumbs.push({
            name: "Favicon Generator",
            url: `https://pdfpage.in${currentPath}`,
            position: breadcrumbs.length + 1
          });
        }
      } else {
        breadcrumbs.push({
          name,
          url: `https://pdfpage.in${currentPath}`,
          position: breadcrumbs.length + 1
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map(crumb => ({
      "@type": "ListItem",
      "position": crumb.position,
      "name": crumb.name,
      "item": {
        "@type": "WebPage",
        "@id": crumb.url,
        "url": crumb.url,
        "name": crumb.name
      }
    }))
  };

  // Only show breadcrumbs for tool pages and deep navigation
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      
      {/* Additional meta for navigation context */}
      <meta name="breadcrumb" content={breadcrumbs.map(b => b.name).join(' > ')} />
      <meta name="navigation-path" content={path} />
      <meta name="page-hierarchy" content={breadcrumbs.length.toString()} />
    </Helmet>
  );
};

export default EnhancedBreadcrumbSchema;
