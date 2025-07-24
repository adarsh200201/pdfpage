import React, { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, Clock, User, ArrowLeft, ArrowRight, Tag, Share2, BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getPostBySlug, blogPosts, BlogPost } from "@/data/blog-posts";
import { AdvancedSEO } from "@/components/AdvancedSEO";
import ReactMarkdown from 'react-markdown';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const foundPost = getPostBySlug(slug);
      if (foundPost) {
        setPost(foundPost);
        
        // Find related posts by category and tags
        const related = blogPosts
          .filter(p => p.id !== foundPost.id)
          .filter(p => 
            p.category === foundPost.category || 
            p.tags.some(tag => foundPost.tags.includes(tag))
          )
          .slice(0, 3);
        
        setRelatedPosts(related);
        
        // Update page views (in a real app, this would be an API call)
        if (foundPost.views !== undefined) {
          foundPost.views = (foundPost.views || 0) + 1;
        }
      }
      setIsLoading(false);
    }
  }, [slug]);

  const sharePost = async () => {
    if (post && navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Custom markdown components for better styling
  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-4xl font-bold text-gray-900 mb-6 mt-8">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-bold text-gray-900 mb-3 mt-6">{children}</h3>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-700 leading-relaxed mb-6">{children}</p>
    ),
    a: ({ href, children }: any) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-700 underline font-medium"
        target={href?.startsWith('http') ? '_blank' : '_self'}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
        {href?.startsWith('http') && <ExternalLink className="inline w-4 h-4 ml-1" />}
      </a>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside text-gray-700 mb-6 space-y-2">{children}</ol>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-6">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200">
        {children}
      </td>
    ),
    code: ({ children }: any) => (
      <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }: any) => (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6 text-sm">
        {children}
      </pre>
    ),
  };

  return (
    <>
      <AdvancedSEO
        title={post.title}
        description={post.description}
        canonical={post.seoData.canonicalUrl}
        keywords={post.keywords}
        ogImage={post.seoData.ogImage}
        ogType="article"
        publishDate={post.publishDate.toISOString()}
        author={post.author}
        toolName={post.title}
        category="Blog Post"
        breadcrumbList={[
          { name: "Home", url: "https://pdfpage.in" },
          { name: "Blog", url: "https://pdfpage.in/blog" },
          { name: post.title, url: post.seoData.canonicalUrl }
        ]}
        accessibilityFeatures={["ARIA labels", "Keyboard navigation", "Screen reader support", "High contrast support"]}
        performanceMetrics={{
          loadTime: "0.9 seconds",
          coreWebVitals: { lcp: "1.3s", fid: "< 100ms", cls: "< 0.1" }
        }}
        schemaType="BlogPosting"
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.description,
            "image": [post.coverImage],
            "datePublished": post.publishDate.toISOString(),
            "dateModified": post.publishDate.toISOString(),
            "author": {
              "@type": "Person",
              "name": post.author,
              "url": "https://pdfpage.in/about"
            },
            "publisher": {
              "@type": "Organization",
              "name": "PDFPage",
              "logo": {
                "@type": "ImageObject",
                "url": "https://pdfpage.in/logo.svg"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": post.seoData.canonicalUrl
            },
            "keywords": post.keywords.join(", "),
            "articleSection": post.category,
            "wordCount": post.content.split(" ").length,
            "timeRequired": `PT${post.readTime}M`,
            "inLanguage": "en-US",
            "url": post.seoData.canonicalUrl
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Breadcrumb */}
        <nav className="bg-white border-b py-4">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <Link to="/blog" className="hover:text-blue-600">Blog</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium truncate">{post.title}</span>
            </div>
          </div>
        </nav>

        {/* Article Header */}
        <article className="bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Back to Blog */}
            <Link 
              to="/blog"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </Link>

            {/* Category and Tags */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {post.category}
              </Badge>
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{post.readTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{post.content.split(" ").length} words</span>
              </div>
            </div>

            {/* Share Button */}
            <div className="flex justify-between items-center mb-8">
              <p className="text-xl text-gray-600 max-w-3xl">{post.description}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={sharePost}
                className="ml-4 shrink-0"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Featured Image */}
            <div className="mb-12">
              <img
                src={post.coverImage}
                alt={post.coverImageAlt}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown components={markdownComponents}>
                {post.content}
              </ReactMarkdown>
            </div>

            <Separator className="my-12" />

            {/* Related Tools CTA */}
            {post.relatedTools.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-8 mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Try These PDF Tools
                </h3>
                <p className="text-gray-600 mb-6">
                  Put these tips into practice with our free, professional PDF tools:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {post.relatedTools.map(tool => (
                    <Link
                      key={tool.url}
                      to={tool.url}
                      className="block p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                        {tool.name}
                      </h4>
                      <p className="text-sm text-gray-600">{tool.description}</p>
                      <div className="flex items-center gap-2 text-blue-600 text-sm mt-2">
                        Try Tool
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio */}
            <div className="bg-gray-50 rounded-lg p-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {post.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{post.author}</h4>
                  <p className="text-gray-600">
                    PDF expert and founder of PDFPage.in. Passionate about making document management 
                    simple and accessible for everyone. Follow for the latest PDF tips and tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-white border-t py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h3>
              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map(relatedPost => (
                  <Card key={relatedPost.id} className="group hover:shadow-lg transition-shadow">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={relatedPost.coverImage}
                        alt={relatedPost.coverImageAlt}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-gray-900 text-white text-xs">
                          {relatedPost.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h4>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {relatedPost.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{relatedPost.readTime} min read</span>
                        <Link
                          to={`/blog/${relatedPost.slug}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Read More →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  );
};

export default BlogPostPage;
