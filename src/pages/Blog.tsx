import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  FileText,
  ImageIcon,
  Zap,
  Shield,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "How to Convert PDF to Word Without Losing Formatting",
      description: "Learn the best methods to convert PDF documents to Word while preserving layouts, fonts, and formatting. Step-by-step guide with tips and tricks.",
      slug: "pdf-to-word-without-losing-formatting",
      category: "PDF Conversion",
      readTime: "5 min read",
      publishDate: "2025-01-20",
      author: "PDFPage Team",
      image: "/blog/pdf-to-word-guide.jpg",
      tags: ["PDF", "Word", "Conversion", "Formatting"],
      featured: true,
    },
    {
      id: 2,
      title: "10 Best Practices for PDF Compression Without Quality Loss",
      description: "Discover professional techniques to reduce PDF file sizes while maintaining document quality. Perfect for web optimization and email attachments.",
      slug: "pdf-compression-best-practices",
      category: "PDF Optimization",
      readTime: "7 min read", 
      publishDate: "2025-01-18",
      author: "PDFPage Team",
      image: "/blog/pdf-compression-guide.jpg",
      tags: ["PDF", "Compression", "Optimization", "File Size"],
      featured: true,
    },
    {
      id: 3,
      title: "Image Compression Guide: Reduce File Size by 90% Without Quality Loss",
      description: "Complete guide to image compression techniques, formats, and tools. Learn when to use JPG vs PNG vs WebP for optimal results.",
      slug: "image-compression-guide",
      category: "Image Optimization",
      readTime: "6 min read",
      publishDate: "2025-01-15",
      author: "PDFPage Team", 
      image: "/blog/image-compression-guide.jpg",
      tags: ["Images", "Compression", "WebP", "Optimization"],
      featured: false,
    },
    {
      id: 4,
      title: "Free PDF Tools for Students: Study Smarter, Not Harder",
      description: "Essential PDF tools every student needs for research, note-taking, and document management. Boost your productivity with these free resources.",
      slug: "free-pdf-tools-students",
      category: "Education",
      readTime: "4 min read",
      publishDate: "2025-01-12",
      author: "PDFPage Team",
      image: "/blog/pdf-tools-students.jpg",
      tags: ["Education", "Students", "PDF Tools", "Productivity"],
      featured: false,
    },
    {
      id: 5,
      title: "How to Create Professional Favicons for Your Website",
      description: "Step-by-step guide to creating high-quality favicons that look great across all devices and browsers. Includes sizing, formats, and best practices.",
      slug: "create-professional-favicons",
      category: "Web Development",
      readTime: "8 min read",
      publishDate: "2025-01-10",
      author: "PDFPage Team",
      image: "/blog/favicon-creation-guide.jpg",
      tags: ["Favicon", "Web Design", "Icons", "Branding"],
      featured: false,
    },
    {
      id: 6,
      title: "PDF Security: How to Password Protect and Encrypt Documents",
      description: "Complete guide to PDF security features including password protection, encryption levels, and permission settings. Keep your documents safe.",
      slug: "pdf-security-password-protection",
      category: "PDF Security",
      readTime: "6 min read",
      publishDate: "2025-01-08",
      author: "PDFPage Team",
      image: "/blog/pdf-security-guide.jpg",
      tags: ["PDF", "Security", "Encryption", "Privacy"],
      featured: false,
    },
  ];

  const categories = [
    { name: "PDF Conversion", count: 8, icon: FileText },
    { name: "Image Optimization", count: 6, icon: ImageIcon },
    { name: "PDF Optimization", count: 5, icon: Zap },
    { name: "PDF Security", count: 4, icon: Shield },
    { name: "Web Development", count: 3, icon: Lightbulb },
    { name: "Education", count: 3, icon: TrendingUp },
  ];

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <SEO
        title="PDF & Image Tools Blog - Tips, Guides & Best Practices"
        description="Expert guides on PDF conversion, image optimization, and document management. Learn how to use PDF tools effectively with step-by-step tutorials and best practices."
        keywords="PDF tutorials, image optimization guide, document conversion tips, PDF compression, online tools guide, productivity tips, PDF best practices"
        canonical="/blog"
        schemaData={{
          "@type": "Blog",
          "name": "PDFPage Blog",
          "description": "Expert guides and tutorials for PDF and image tools",
          "blogPost": blogPosts.map(post => ({
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.description,
            "url": `https://pdfpage.in/blog/${post.slug}`,
            "datePublished": post.publishDate,
            "author": {
              "@type": "Organization",
              "name": post.author
            }
          }))
        }}
      />
      
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            PDF & Image Tools Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert guides, tutorials, and best practices for PDF conversion, 
            image optimization, and document management tools.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Featured Articles
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredPosts.map((post) => (
                    <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
                      <CardHeader className="p-0">
                        <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
                          <FileText className="w-16 h-16 text-blue-600" />
                          <Badge className="absolute top-3 right-3 bg-orange-500">Featured</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {post.category}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                        <CardTitle className="text-xl mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600 mb-4 line-clamp-3">
                          {post.description}
                        </CardDescription>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <User className="w-4 h-4" />
                            <span>{post.author}</span>
                            <Calendar className="w-4 h-4 ml-2" />
                            <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="group-hover:text-blue-600">
                            Read More
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Articles</h2>
              <div className="space-y-6">
                {regularPosts.map((post) => (
                  <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <div className="w-32 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-8 h-8 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {post.category}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.readTime}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {post.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <User className="w-3 h-3" />
                              <span>{post.author}</span>
                              <Calendar className="w-3 h-3 ml-2" />
                              <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="group-hover:text-blue-600">
                              Read More
                              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <Link
                        key={category.name}
                        to={`/blog/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                            {category.name}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Newsletter Signup */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-center">Stay Updated</CardTitle>
                  <CardDescription className="text-center">
                    Get the latest tips and tutorials delivered to your inbox
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button className="w-full">
                      Subscribe
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "PDF to Word", href: "/pdf-to-word" },
                    { name: "Merge PDF", href: "/merge-pdf" },
                    { name: "Compress PDF", href: "/compress-pdf" },
                    { name: "Image Compressor", href: "/img/compress" },
                    { name: "Split PDF", href: "/split-pdf" },
                  ].map((tool) => (
                    <Link
                      key={tool.name}
                      to={tool.href}
                      className="block p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        {tool.name}
                      </span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
