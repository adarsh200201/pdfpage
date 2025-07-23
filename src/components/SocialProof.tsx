import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  Users,
  Download,
  Shield,
  Clock,
  CheckCircle,
  Globe,
  TrendingUp,
  Award,
  Zap,
  Heart,
  ThumbsUp,
  MessageCircle,
  Eye
} from "lucide-react";

interface SocialProofProps {
  variant?: "hero" | "sidebar" | "footer" | "inline";
  showStats?: boolean;
  showTestimonials?: boolean;
  showTrustBadges?: boolean;
  showRecentActivity?: boolean;
}

const SocialProof = ({
  variant = "hero",
  showStats = true,
  showTestimonials = true,
  showTrustBadges = true,
  showRecentActivity = false
}: SocialProofProps) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [liveUserCount, setLiveUserCount] = useState(2847);

  // Simulate live user count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUserCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    if (showTestimonials) {
      const interval = setInterval(() => {
        setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showTestimonials]);

  const stats = [
    {
      icon: Users,
      value: "2.5M+",
      label: "Monthly Users",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Download,
      value: "45M+",
      label: "Files Processed",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Star,
      value: "4.8/5",
      label: "User Rating",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      icon: Globe,
      value: "195+",
      label: "Countries",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Marketing Manager",
      company: "TechCorp",
      avatar: "/avatars/sarah.jpg",
      rating: 5,
      text: "PDFPage has revolutionized how our team handles documents. The conversion quality is outstanding and it's incredibly fast.",
      verified: true,
      date: "2 days ago"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Graphic Designer",
      company: "Creative Studio",
      avatar: "/avatars/michael.jpg",
      rating: 5,
      text: "I use the image compressor daily for client work. It reduces file sizes by 90% without any quality loss. Absolutely brilliant!",
      verified: true,
      date: "1 week ago"
    },
    {
      id: 3,
      name: "Emma Davis",
      role: "Student",
      company: "University",
      avatar: "/avatars/emma.jpg",
      rating: 5,
      text: "Perfect for academic work! I've converted hundreds of PDFs for my research. Free, fast, and no annoying watermarks.",
      verified: true,
      date: "3 days ago"
    },
    {
      id: 4,
      name: "David Wilson",
      role: "Project Manager",
      company: "Global Solutions",
      avatar: "/avatars/david.jpg",
      rating: 4,
      text: "Reliable tool for business documents. The batch processing feature saves us hours every week. Highly recommended!",
      verified: true,
      date: "5 days ago"
    }
  ];

  const trustBadges = [
    {
      icon: Shield,
      title: "100% Secure",
      description: "SSL encrypted"
    },
    {
      icon: Clock,
      title: "24/7 Available",
      description: "Always online"
    },
    {
      icon: CheckCircle,
      title: "No Registration",
      description: "Start immediately"
    },
    {
      icon: Heart,
      title: "Always Free",
      description: "No hidden costs"
    }
  ];

  const recentActivity = [
    "John from New York just converted 3 PDFs to Word",
    "Maria from London compressed 5 images",
    "Alex from Tokyo merged 4 PDF files",
    "Sophie from Paris created a favicon",
    "Carlos from Madrid split a 50-page PDF"
  ];

  if (variant === "hero") {
    return (
      <div className="space-y-8">
        {/* Live Stats */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Featured Testimonial */}
        {showTestimonials && (
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={testimonials[currentTestimonial].avatar} />
                  <AvatarFallback>
                    {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    {testimonials[currentTestimonial].verified && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified User
                      </Badge>
                    )}
                  </div>
                  <blockquote className="text-gray-700 mb-3">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-gray-500">
                      {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial indicators */}
              <div className="flex justify-center mt-4 gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentTestimonial(index)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trust Badges */}
        {showTrustBadges && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge, index) => {
              const IconComponent = badge.icon;
              return (
                <div key={index} className="text-center p-4 bg-white rounded-lg border">
                  <IconComponent className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900 text-sm">{badge.title}</div>
                  <div className="text-xs text-gray-500">{badge.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="space-y-6">
        {/* Live Users */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium text-sm">{liveUserCount.toLocaleString()} users online</div>
                <div className="text-xs text-gray-500">Processing files right now</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Why Users Choose Us</h3>
            {stats.slice(0, 3).map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <div>
                  <div className="font-medium text-sm">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {showRecentActivity && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {recentActivity.slice(0, 3).map((activity, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {activity}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Inline variant for tool pages
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats[0].value}</div>
          <div className="text-sm text-gray-600">{stats[0].label}</div>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
            ))}
          </div>
          <div className="text-sm text-gray-600">15,420+ reviews</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">100%</div>
          <div className="text-sm text-gray-600">Free & Secure</div>
        </div>
      </div>
    </div>
  );
};

export default SocialProof;
