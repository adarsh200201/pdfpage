import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOChecklistTable from "@/components/SEOChecklistTable";
import SEO100Summary from "@/components/SEO100Summary";
import AdvancedSEO from "@/components/AdvancedSEO";

const SEOAudit: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <AdvancedSEO
        title="Complete SEO Audit Results - PDFPage.in Analysis"
        description="Comprehensive SEO audit results for PDFPage.in showing optimization status across all pages. Technical SEO, content quality, schema markup, and performance analysis."
        keywords="SEO audit, PDFPage SEO, website optimization, technical SEO, schema markup, meta tags analysis, SEO checklist"
        canonical="/seo-audit"
        ogImage="/og-images/seo-audit-results.jpg"
        contentType="page"
        enablePreconnect={true}
        criticalCSS={true}
      />
      
      <Header />
      
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <SEO100Summary />
          <SEOChecklistTable />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SEOAudit;
