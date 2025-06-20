import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Users,
  Globe,
  Shield,
  Zap,
  Heart,
  Target,
  Award,
  CheckCircle,
  ArrowRight,
  FileText,
  Lock,
  Cloud,
} from "lucide-react";

const About = () => {
  const stats = [
    { number: "10M+", label: "PDFs Processed", icon: FileText },
    { number: "500K+", label: "Happy Users", icon: Users },
    { number: "99.9%", label: "Uptime", icon: Cloud },
    { number: "256-bit", label: "SSL Encryption", icon: Lock },
  ];

  const values = [
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "Your documents are automatically deleted after processing. We never store or access your files.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Process your PDFs in seconds with our optimized cloud infrastructure and advanced algorithms.",
    },
    {
      icon: Globe,
      title: "Always Available",
      description:
        "Access our tools 24/7 from any device, anywhere in the world. No downloads required.",
    },
    {
      icon: Heart,
      title: "User Focused",
      description:
        "Every feature is designed with you in mind. Simple, intuitive, and powerful PDF tools.",
    },
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Founder",
      bio: "Former Adobe engineer with 15+ years in document technology.",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    },
    {
      name: "Michael Rodriguez",
      role: "CTO",
      bio: "Full-stack engineer specializing in cloud architecture and security.",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    },
    {
      name: "Emily Johnson",
      role: "Head of Product",
      bio: "UX expert focused on making complex tools simple and accessible.",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    },
    {
      name: "David Kim",
      role: "Lead Developer",
      bio: "PDF processing specialist with expertise in document manipulation.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red/5 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-brand-red/10 text-brand-red border-brand-red/20">
              About PdfPage
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-text-dark mb-6">
              The Ultimate <span className="text-brand-red">PDF Toolkit</span>
            </h1>
            <p className="text-xl text-text-medium mb-8 leading-relaxed">
              We're on a mission to make PDF processing simple, secure, and
              accessible to everyone. From small businesses to enterprise teams,
              we provide the tools you need to work with PDFs efficiently.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-brand-red hover:bg-red-700"
              >
                <Link to="/pricing">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
                  <stat.icon className="h-6 w-6 text-brand-red" />
                </div>
                <div className="text-3xl font-bold text-text-dark mb-2">
                  {stat.number}
                </div>
                <div className="text-text-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-text-medium mb-6 leading-relaxed">
                We believe that working with PDFs shouldn't be complicated or
                expensive. That's why we've built the most comprehensive,
                user-friendly PDF toolkit on the web.
              </p>
              <p className="text-lg text-text-medium mb-8 leading-relaxed">
                Since our launch, we've helped millions of users merge, split,
                convert, and edit their PDFs with enterprise-grade security and
                consumer-friendly simplicity.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-text-medium">
                    100% browser-based - no software installation required
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-text-medium">
                    Military-grade encryption and automatic file deletion
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-text-medium">
                    Supporting 25+ PDF operations and growing
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                alt="Team collaboration"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-brand-red" />
                  <div>
                    <div className="font-semibold text-text-dark">Our Goal</div>
                    <div className="text-sm text-text-medium">
                      Simplify document workflow
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
              Our Values
            </h2>
            <p className="text-lg text-text-medium max-w-2xl mx-auto">
              These principles guide everything we do, from product development
              to customer support.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="border-none shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-brand-red" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-medium leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
              Meet Our Team
            </h2>
            <p className="text-lg text-text-medium max-w-2xl mx-auto">
              Passionate experts dedicated to building the best PDF tools on the
              web.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="border-none shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-lg font-semibold text-text-dark mb-1">
                    {member.name}
                  </h3>
                  <p className="text-brand-red font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-sm text-text-medium leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red to-red-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your PDF Workflow?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join millions of users who trust PdfPage for their document
            processing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/">
                Try All Tools Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-brand-red"
              asChild
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
