import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  Search,
  FileText,
  Shield,
  Zap,
  Lightbulb,
  TrendingUp,
  BookOpen,
} from "lucide-react";

const Blog = () => {
  const featuredPost = {
    title: "10 PDF Security Best Practices Every Business Should Know",
    excerpt:
      "Learn how to protect your sensitive documents with these essential PDF security strategies that will keep your business data safe.",
    author: "Sarah Chen",
    date: "Dec 15, 2024",
    readTime: "8 min read",
    image:
      "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800&h=400&fit=crop",
    category: "Security",
    href: "/blog/pdf-security-best-practices",
  };

  const recentPosts = [
    {
      title: "How to Compress PDFs Without Losing Quality",
      excerpt:
        "Step-by-step guide to reducing PDF file sizes while maintaining document clarity and readability.",
      author: "Michael Rodriguez",
      date: "Dec 12, 2024",
      readTime: "5 min read",
      image:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=250&fit=crop",
      category: "Tutorials",
      href: "/blog/compress-pdf-guide",
    },
    {
      title:
        "Digital Signatures vs. Electronic Signatures: What's the Difference?",
      excerpt:
        "Understanding the legal and technical differences between digital and electronic signatures for documents.",
      author: "Emily Johnson",
      date: "Dec 10, 2024",
      readTime: "6 min read",
      image:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop",
      category: "Legal",
      href: "/blog/digital-vs-electronic-signatures",
    },
    {
      title: "The Complete Guide to PDF Accessibility",
      excerpt:
        "Make your PDFs accessible to everyone with these comprehensive accessibility guidelines and best practices.",
      author: "David Kim",
      date: "Dec 8, 2024",
      readTime: "10 min read",
      image:
        "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=250&fit=crop",
      category: "Accessibility",
      href: "/blog/pdf-accessibility-guide",
    },
    {
      title: "5 Ways PDF Tools Can Boost Your Remote Team's Productivity",
      excerpt:
        "Discover how the right PDF tools can streamline workflows and improve collaboration for distributed teams.",
      author: "Sarah Chen",
      date: "Dec 5, 2024",
      readTime: "7 min read",
      image:
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=250&fit=crop",
      category: "Productivity",
      href: "/blog/pdf-tools-remote-teams",
    },
    {
      title: "Understanding PDF/A: The Standard for Long-term Archiving",
      excerpt:
        "Everything you need to know about PDF/A format and why it's essential for document preservation.",
      author: "Michael Rodriguez",
      date: "Dec 3, 2024",
      readTime: "8 min read",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop",
      category: "Standards",
      href: "/blog/pdf-a-archiving-standard",
    },
    {
      title: "Common PDF Problems and How to Fix Them",
      excerpt:
        "Troubleshoot the most frequent PDF issues with our comprehensive problem-solving guide.",
      author: "Emily Johnson",
      date: "Nov 30, 2024",
      readTime: "9 min read",
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop",
      category: "Troubleshooting",
      href: "/blog/common-pdf-problems",
    },
  ];

  const categories = [
    { name: "All Posts", count: 24, icon: BookOpen },
    { name: "Tutorials", count: 8, icon: Lightbulb },
    { name: "Security", count: 6, icon: Shield },
    { name: "Productivity", count: 5, icon: TrendingUp },
    { name: "Legal", count: 3, icon: FileText },
    { name: "Accessibility", count: 2, icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red/5 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-4xl lg:text-6xl font-bold text-text-dark mb-6">
              PDF <span className="text-brand-red">Knowledge Hub</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Expert insights, tutorials, and best practices for mastering PDF
              workflows
            </p>
            <div className="max-w-md mx-auto relative">
              <Input
                placeholder="Search articles..."
                className="pl-10 pr-4 py-3 text-lg"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-medium" />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h3 className="font-semibold text-text-dark mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <category.icon className="h-4 w-4 text-brand-red" />
                      <span className="text-text-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-text-dark mb-6">
                Featured Article
              </h2>
              <Card className="overflow-hidden shadow-lg">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-1/2 p-6">
                    <Badge className="mb-3 bg-brand-red/10 text-brand-red border-brand-red/20">
                      {featuredPost.category}
                    </Badge>
                    <h3 className="text-xl font-bold text-text-dark mb-3 line-clamp-2">
                      {featuredPost.title}
                    </h3>
                    <p className="text-text-medium mb-4 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-text-light mb-4">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{featuredPost.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{featuredPost.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{featuredPost.readTime}</span>
                      </div>
                    </div>
                    <Button asChild>
                      <Link to={featuredPost.href}>
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Posts */}
            <div>
              <h2 className="text-2xl font-bold text-text-dark mb-6">
                Recent Articles
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {recentPosts.map((post, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <CardHeader className="p-0">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    </CardHeader>
                    <CardContent className="p-6">
                      <Badge className="mb-3 bg-brand-red/10 text-brand-red border-brand-red/20">
                        {post.category}
                      </Badge>
                      <h3 className="text-lg font-semibold text-text-dark mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-text-medium mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-text-light mb-4">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={post.href}>
                          Read More <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Articles
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-text-dark mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-text-medium mb-8">
            Get the latest PDF tips, tutorials, and industry insights delivered
            to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input placeholder="Enter your email" className="flex-1" />
            <Button className="bg-brand-red hover:bg-red-700">Subscribe</Button>
          </div>
          <p className="text-sm text-text-light mt-3">
            Join 50,000+ subscribers. Unsubscribe anytime.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
