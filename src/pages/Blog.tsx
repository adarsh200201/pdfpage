import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Calendar, Clock, User, ArrowRight, Search, Filter, Tag, TrendingUp, FileText, Zap, Shield, Layers, BookOpen, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { blogPosts, featuredPosts, getAllCategories, getAllTags } from "@/data/blog-posts";
import { AdvancedSEO } from "@/components/AdvancedSEO";

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const categories = getAllCategories();
  const tags = getAllTags();

  // Function to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pdf tools':
        return <FileText className="w-4 h-4" />;
      case 'tutorials':
        return <BookOpen className="w-4 h-4" />;
      case 'tips & tricks':
        return <Zap className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'productivity':
        return <Layers className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  // Function to get fallback image
  const getFallbackImage = (category: string) => {
    const images = {
      'PDF Tools': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Tutorials': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Tips & Tricks': 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Security': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Productivity': 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    };
    return images[category] || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  };

  // Filter and sort posts
  const filteredPosts = blogPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
      const matchesTag = selectedTag === "all" || post.tags.includes(selectedTag);
      
      return matchesSearch && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        case "readTime":
          return a.readTime - b.readTime;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedTag("all");
    setSortBy("date");
  };

  return (
    <>
      <AdvancedSEO
        title="PDF Tools Blog - Expert Tips, Guides & Best Practices | PDFPage"
        description="Discover expert PDF tips, comprehensive guides, and best practices for document management. Learn how to use PDF tools effectively with our in-depth tutorials and comparisons."
        canonical="https://pdfpage.in/blog"
        keywords={["pdf blog", "pdf tips", "pdf guides", "document management", "pdf tools tutorial", "pdf best practices"]}
        ogImage="https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2Fblog-header-seo-image?format=webp&width=1200&height=630"
        toolName="PDF Blog"
        category="Educational Content"
        alternateUrls={[
          { hreflang: "en", href: "https://pdfpage.in/blog" },
          { hreflang: "es", href: "https://pdfpage.in/es/blog" },
          { hreflang: "fr", href: "https://pdfpage.in/fr/blog" }
        ]}
        breadcrumbList={[
          { name: "Home", url: "https://pdfpage.in" },
          { name: "Blog", url: "https://pdfpage.in/blog" }
        ]}
        accessibilityFeatures={["ARIA labels", "Keyboard navigation", "Screen reader support", "High contrast support"]}
        performanceMetrics={{
          loadTime: "0.8 seconds",
          coreWebVitals: { lcp: "1.2s", fid: "< 100ms", cls: "< 0.1" }
        }}
        schemaType="Blog"
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "PDFPage Blog",
            "description": "Expert PDF tips, guides, and best practices for document management",
            "url": "https://pdfpage.in/blog",
            "publisher": {
              "@type": "Organization",
              "name": "PDFPage",
              "logo": "https://pdfpage.in/logo.svg"
            },
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": blogPosts.map((post, index) => ({
                "@type": "BlogPosting",
                "position": index + 1,
                "headline": post.title,
                "description": post.description,
                "url": `https://pdfpage.in/blog/${post.slug}`,
                "datePublished": post.publishDate.toISOString(),
                "author": {
                  "@type": "Person",
                  "name": post.author
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "PDFPage"
                }
              }))
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='7' r='7'/%3E%3Ccircle cx='7' cy='53' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Hero Image */}
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-20 hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Blog writing and documentation"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center lg:text-left lg:max-w-2xl">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                </div>
                <span className="text-blue-200 font-medium">Knowledge Hub</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                PDF Tools Blog
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
                Expert tips, comprehensive guides, and best practices for mastering PDF tools and document management
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center gap-2 text-blue-200">
                  <TrendingUp className="w-5 h-5" />
                  <span>{blogPosts.length} expert articles</span>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <User className="w-5 h-5" />
                  <span>Written by PDF experts</span>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <Calendar className="w-5 h-5" />
                  <span>Updated weekly</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="py-8 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Stats bar */}
            <div className="flex items-center justify-center gap-8 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{blogPosts.length} Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{categories.length} Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{tags.length} Tags</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search articles, guides, tips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2"
                />
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-[130px]">
                    <Tag className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {tags.map(tag => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Latest</SelectItem>
                    <SelectItem value="readTime">Read Time</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>

                {(searchTerm || selectedCategory !== "all" || selectedTag !== "all" || sortBy !== "date") && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && searchTerm === "" && selectedCategory === "all" && selectedTag === "all" && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Featured Articles</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredPosts.slice(0, 3).map((post, index) => (
                  <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={post.coverImage}
                        alt={post.coverImageAlt}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImage(post.category);
                        }}
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>

                      {/* Reading rank badge */}
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-sm font-bold text-gray-800">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime} min read</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                      >
                        Read Article
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                All Articles
                {filteredPosts.length !== blogPosts.length && (
                  <span className="text-gray-500 text-lg ml-2">
                    ({filteredPosts.length} results)
                  </span>
                )}
              </h2>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No articles found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search terms or filters</p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map(post => (
                  <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={post.coverImage}
                        alt={post.coverImageAlt}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImage(post.category);
                        }}
                      />
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-gray-900 text-white flex items-center gap-1">
                          {getCategoryIcon(post.category)}
                          {post.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime} min</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {post.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span>{post.author}</span>
                        </div>
                        
                        <Link
                          to={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                        >
                          Read More
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="relative py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,89.2,-0.5C88.4,15.3,84.2,30.6,76.1,43.9C68,57.2,56,68.5,42.2,75.8C28.4,83.1,14.2,86.4,-0.5,87.2C-15.2,88,-30.4,86.3,-43.8,79.5C-57.2,72.7,-68.8,60.8,-76.2,46.2C-83.6,31.6,-86.8,15.8,-86.2,0.2C-85.6,-15.4,-81.2,-30.8,-73.6,-44.2C-66,-57.6,-55.2,-69,-42.2,-76.2C-29.2,-83.4,-14.6,-86.4,0.7,-87.7C16,-89,32,-88.6,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay Updated with PDF Tips
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Get the latest PDF guides, tool updates, and expert tips delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white text-gray-900 border-0"
              />
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                Subscribe
              </Button>
            </div>
            <p className="text-sm text-blue-200 mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </section>

        {/* Popular Categories */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Explore by Category
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover in-depth guides and tutorials organized by topic
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.slice(0, 4).map((category, index) => {
                const categoryPosts = blogPosts.filter(post => post.category === category);
                const gradients = [
                  'from-blue-500 to-blue-700',
                  'from-purple-500 to-purple-700',
                  'from-green-500 to-green-700',
                  'from-orange-500 to-orange-700'
                ];

                return (
                  <Link
                    key={category}
                    to={`/blog?category=${encodeURIComponent(category)}`}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 bg-gradient-to-br ${gradients[index % 4]} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          {getCategoryIcon(category)}
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {category}
                        </h3>

                        <p className="text-gray-600 text-sm mb-3">
                          {categoryPosts.length} article{categoryPosts.length !== 1 ? 's' : ''}
                        </p>

                        <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                          Explore articles
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Blog;
