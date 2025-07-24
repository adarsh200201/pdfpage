import React from 'react';
import { Helmet } from 'react-helmet-async';
import { blogPosts } from '@/data/blog-posts';

interface BlogSEOProps {
  currentSlug?: string;
}

export const BlogSEO: React.FC<BlogSEOProps> = ({ currentSlug }) => {
  const currentPost = currentSlug ? blogPosts.find(post => post.slug === currentSlug) : null;
  
  return (
    <Helmet>
      {/* Blog-specific meta tags */}
      <meta name="article:publisher" content="https://pdfpage.in" />
      <meta name="article:section" content="PDF Tools" />
      
      {/* Open Graph Article Tags */}
      {currentPost && (
        <>
          <meta property="article:published_time" content={currentPost.publishDate.toISOString()} />
          <meta property="article:modified_time" content={currentPost.publishDate.toISOString()} />
          <meta property="article:author" content={currentPost.author} />
          <meta property="article:section" content={currentPost.category} />
          {currentPost.tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card for Blog */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@pdfpage" />
      <meta name="twitter:creator" content="@pdfpage" />
      
      {/* RSS Feed */}
      <link rel="alternate" type="application/rss+xml" title="PDFPage Blog RSS Feed" href="/blog/feed.xml" />
      <link rel="alternate" type="application/atom+xml" title="PDFPage Blog Atom Feed" href="/blog/feed.atom" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://cdn.builder.io" />
      
      {/* Blog JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://pdfpage.in/#website",
              "url": "https://pdfpage.in",
              "name": "PDFPage",
              "description": "Free PDF tools and document processing",
              "potentialAction": [
                {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://pdfpage.in/blog?search={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              ],
              "inLanguage": "en-US"
            },
            {
              "@type": "Blog",
              "@id": "https://pdfpage.in/blog/#blog",
              "url": "https://pdfpage.in/blog",
              "name": "PDFPage Blog",
              "description": "Expert PDF tips, guides, and best practices",
              "inLanguage": "en-US",
              "isPartOf": {
                "@id": "https://pdfpage.in/#website"
              },
              "publisher": {
                "@type": "Organization",
                "@id": "https://pdfpage.in/#organization",
                "name": "PDFPage",
                "url": "https://pdfpage.in",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://pdfpage.in/logo.svg",
                  "width": 200,
                  "height": 60
                }
              },
              "blogPost": blogPosts.map(post => ({
                "@type": "BlogPosting",
                "@id": `https://pdfpage.in/blog/${post.slug}/#article`,
                "url": `https://pdfpage.in/blog/${post.slug}`,
                "headline": post.title,
                "description": post.description,
                "image": {
                  "@type": "ImageObject",
                  "url": post.coverImage,
                  "width": 1200,
                  "height": 630
                },
                "datePublished": post.publishDate.toISOString(),
                "dateModified": post.publishDate.toISOString(),
                "author": {
                  "@type": "Person",
                  "name": post.author,
                  "url": "https://pdfpage.in/about"
                },
                "publisher": {
                  "@id": "https://pdfpage.in/#organization"
                },
                "articleSection": post.category,
                "keywords": post.keywords.join(", "),
                "wordCount": post.content.split(" ").length,
                "timeRequired": `PT${post.readTime}M`,
                "mainEntityOfPage": {
                  "@type": "WebPage",
                  "@id": `https://pdfpage.in/blog/${post.slug}/#webpage`
                }
              }))
            }
          ]
        })}
      </script>
    </Helmet>
  );
};

export default BlogSEO;
