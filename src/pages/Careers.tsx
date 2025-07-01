import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  DollarSign,
  Users,
  Heart,
  Coffee,
  Laptop,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const Careers = () => {
  const openPositions = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "$120k - $160k",
      description:
        "Build beautiful, responsive interfaces for our PDF processing platform using React and TypeScript.",
      requirements: [
        "5+ years React experience",
        "TypeScript proficiency",
        "UI/UX design skills",
      ],
      href: "/careers/senior-frontend-developer",
    },
    {
      title: "Backend Engineer - PDF Processing",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "$110k - $150k",
      description:
        "Develop and optimize PDF processing algorithms and cloud infrastructure at scale.",
      requirements: [
        "Node.js/Python expertise",
        "Cloud platforms (AWS/Azure)",
        "PDF processing experience",
      ],
      href: "/careers/backend-engineer",
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Remote",
      type: "Full-time",
      salary: "$130k - $170k",
      description:
        "Drive product strategy and roadmap for our suite of PDF tools and enterprise features.",
      requirements: [
        "3+ years PM experience",
        "B2B SaaS background",
        "Technical understanding",
      ],
      href: "/careers/product-manager",
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
      salary: "$70k - $90k",
      description:
        "Help enterprise customers succeed with our platform and drive adoption of premium features.",
      requirements: [
        "Customer-facing experience",
        "SaaS industry knowledge",
        "Excellent communication",
      ],
      href: "/careers/customer-success-manager",
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "$105k - $140k",
      description:
        "Manage and scale our cloud infrastructure to handle millions of PDF processing requests.",
      requirements: [
        "Kubernetes/Docker",
        "CI/CD pipelines",
        "AWS/GCP experience",
      ],
      href: "/careers/devops-engineer",
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      salary: "$80k - $110k",
      description:
        "Lead digital marketing initiatives to grow our user base and increase brand awareness.",
      requirements: [
        "Digital marketing experience",
        "Content creation skills",
        "Analytics proficiency",
      ],
      href: "/careers/marketing-manager",
    },
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description:
        "Comprehensive health, dental, and vision insurance plus wellness stipend",
    },
    {
      icon: Laptop,
      title: "Remote-First",
      description:
        "Work from anywhere with quarterly team meetups and flexible hours",
    },
    {
      icon: TrendingUp,
      title: "Growth & Learning",
      description:
        "Annual learning budget and career development opportunities",
    },
    {
      icon: Coffee,
      title: "Work-Life Balance",
      description:
        "Unlimited PTO, sabbatical program, and mental health support",
    },
    {
      icon: DollarSign,
      title: "Competitive Pay",
      description:
        "Market-rate salaries, equity participation, and performance bonuses",
    },
    {
      icon: Users,
      title: "Inclusive Culture",
      description:
        "Diverse team, mentorship programs, and inclusive hiring practices",
    },
  ];

  const values = [
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "We protect user data like it's our own and build trust through transparency.",
    },
    {
      icon: Zap,
      title: "Move Fast",
      description:
        "We ship quickly, iterate based on feedback, and aren't afraid to fail fast.",
    },
    {
      icon: Users,
      title: "Customer Obsessed",
      description:
        "Every decision starts with asking 'How does this help our users?'",
    },
    {
      icon: Globe,
      title: "Think Global",
      description:
        "We build products for the world and embrace diverse perspectives.",
    },
  ];

  const stats = [
    { number: "50+", label: "Team Members" },
    { number: "12", label: "Countries" },
    { number: "4.8/5", label: "Glassdoor Rating" },
    { number: "95%", label: "Employee Satisfaction" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red/5 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-text-dark mb-6">
              Join Our <span className="text-brand-red">Mission</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Help us build the world's most powerful PDF toolkit and transform
              how people work with documents
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-brand-red hover:bg-red-700"
              >
                <a href="#open-positions">
                  View Open Positions <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/about">Learn About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-text-dark mb-2">
                  {stat.number}
                </div>
                <div className="text-text-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Work Here */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
              Why PdfPage?
            </h2>
            <p className="text-lg text-text-medium max-w-2xl mx-auto">
              We're building the future of document processing, and we want you
              to be part of it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="mx-auto w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-brand-red" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-medium">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-text-dark mb-8">
              Benefits & Perks
            </h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-brand-red" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-dark mb-2">
                        {benefit.title}
                      </h4>
                      <p className="text-text-medium text-sm">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="open-positions" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
              Open Positions
            </h2>
            <p className="text-lg text-text-medium">
              Find your perfect role and help us shape the future of PDF
              processing
            </p>
          </div>

          <div className="grid gap-6">
            {openPositions.map((position, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-text-dark">
                          {position.title}
                        </h3>
                        <Badge className="bg-brand-red/10 text-brand-red border-brand-red/20">
                          {position.department}
                        </Badge>
                      </div>

                      <p className="text-text-medium mb-4">
                        {position.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-text-light mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{position.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{position.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{position.salary}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-text-dark">
                          Key Requirements:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {position.requirements.map((req, reqIndex) => (
                            <div
                              key={reqIndex}
                              className="flex items-center gap-1 text-sm text-text-medium"
                            >
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button asChild className="bg-brand-red hover:bg-red-700">
                        <Link to={position.href}>
                          Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-text-medium mb-4">
              Don't see a perfect fit? We're always looking for talented people.
            </p>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Send Us Your Resume</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-text-dark mb-8">
            Our Hiring Process
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-brand-red text-white rounded-full flex items-center justify-center mx-auto font-bold">
                1
              </div>
              <h3 className="font-semibold text-text-dark">Apply</h3>
              <p className="text-sm text-text-medium">
                Submit your application and resume
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-brand-red text-white rounded-full flex items-center justify-center mx-auto font-bold">
                2
              </div>
              <h3 className="font-semibold text-text-dark">Screen</h3>
              <p className="text-sm text-text-medium">
                Initial phone or video call
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-brand-red text-white rounded-full flex items-center justify-center mx-auto font-bold">
                3
              </div>
              <h3 className="font-semibold text-text-dark">Interview</h3>
              <p className="text-sm text-text-medium">
                Technical and cultural fit assessment
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-brand-red text-white rounded-full flex items-center justify-center mx-auto font-bold">
                4
              </div>
              <h3 className="font-semibold text-text-dark">Decision</h3>
              <p className="text-sm text-text-medium">
                Final decision and offer
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
