import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  CheckCircle,
  Globe,
  BarChart,
  Gift,
  Clock,
  Target,
  Star,
  Zap,
  Shield,
} from "lucide-react";

const Affiliate = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "High Commissions",
      description:
        "Earn up to 40% recurring commission on every successful referral",
    },
    {
      icon: Clock,
      title: "90-Day Cookie",
      description:
        "Extended attribution window ensures you get credit for your referrals",
    },
    {
      icon: BarChart,
      title: "Real-time Analytics",
      description:
        "Track clicks, conversions, and earnings with detailed reporting",
    },
    {
      icon: Gift,
      title: "Bonus Rewards",
      description:
        "Earn extra bonuses for hitting monthly and quarterly milestones",
    },
    {
      icon: Users,
      title: "Dedicated Support",
      description: "Personal affiliate manager to help optimize your campaigns",
    },
    {
      icon: Globe,
      title: "Global Program",
      description: "Promote worldwide with multi-currency payouts available",
    },
  ];

  const commissionTiers = [
    {
      tier: "Starter",
      referrals: "1-10",
      commission: "25%",
      features: ["Basic reporting", "Email support", "Marketing materials"],
      badge: "Getting Started",
    },
    {
      tier: "Growth",
      referrals: "11-50",
      commission: "30%",
      features: [
        "Advanced analytics",
        "Priority support",
        "Custom landing pages",
      ],
      badge: "Most Popular",
    },
    {
      tier: "Pro",
      referrals: "51-100",
      commission: "35%",
      features: [
        "Dedicated manager",
        "Co-marketing opportunities",
        "Early access to features",
      ],
      badge: "Recommended",
    },
    {
      tier: "Elite",
      referrals: "100+",
      commission: "40%",
      features: [
        "Custom commission rates",
        "Joint webinars",
        "Product roadmap input",
      ],
      badge: "Top Performer",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Apply",
      description:
        "Fill out our simple application form and get approved within 24 hours",
    },
    {
      number: "2",
      title: "Promote",
      description:
        "Use your unique links and marketing materials to promote PdfPage",
    },
    {
      number: "3",
      title: "Earn",
      description:
        "Get paid monthly via PayPal, bank transfer, or crypto for every conversion",
    },
  ];

  const resources = [
    {
      title: "Banner Ads",
      description: "High-converting display banners in multiple sizes",
      icon: Target,
    },
    {
      title: "Email Templates",
      description: "Proven email campaigns to engage your audience",
      icon: Zap,
    },
    {
      title: "Content Library",
      description: "Blog posts, tutorials, and case studies",
      icon: Globe,
    },
    {
      title: "Video Assets",
      description: "Product demos and explainer videos",
      icon: Star,
    },
  ];

  const stats = [
    { number: "$2.1M", label: "Paid to Affiliates" },
    { number: "5,000+", label: "Active Affiliates" },
    { number: "15%", label: "Average Conversion Rate" },
    { number: "$150", label: "Average Commission/Sale" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red/5 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-brand-red/10 text-brand-red border-brand-red/20">
              💰 High Converting Affiliate Program
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-text-dark mb-6">
              Earn Up to <span className="text-brand-red">40% Commission</span>
            </h1>
            <p className="text-xl text-text-medium mb-8 leading-relaxed">
              Join thousands of successful affiliates promoting the world's most
              popular PDF toolkit. High converting offers with industry-leading
              commission rates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-brand-red hover:bg-red-700">
                <a href="#apply-now">
                  Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">Have Questions?</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
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

      {/* Commission Tiers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
              Commission Structure
            </h2>
            <p className="text-lg text-text-medium max-w-2xl mx-auto">
              Grow your earnings as you refer more customers. Higher tiers
              unlock better rates and exclusive benefits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {commissionTiers.map((tier, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden ${index === 1 ? "border-brand-red shadow-lg scale-105" : ""}`}
              >
                {tier.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge
                      className={
                        index === 1
                          ? "bg-brand-red text-white"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {tier.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-bold text-text-dark">
                    {tier.tier}
                  </CardTitle>
                  <p className="text-text-medium">
                    {tier.referrals} referrals/month
                  </p>
                  <div className="text-3xl font-bold text-brand-red mt-2">
                    {tier.commission}
                  </div>
                  <p className="text-sm text-text-light">
                    recurring commission
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-text-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
              Why Join Our Program?
            </h2>
            <p className="text-lg text-text-medium max-w-2xl mx-auto">
              We provide everything you need to succeed as a PdfPage affiliate
              partner.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="text-center border-none shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="mx-auto w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-brand-red" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-text-medium">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
              How It Works
            </h2>
            <p className="text-lg text-text-medium">
              Get started in minutes and begin earning commissions right away
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-red rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-text-dark mb-4">
                  {step.title}
                </h3>
                <p className="text-text-medium">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketing Resources */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
              Marketing Resources
            </h2>
            <p className="text-lg text-text-medium">
              Access professional marketing materials to maximize your
              conversions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="mx-auto w-12 h-12 bg-brand-red/10 rounded-lg flex items-center justify-center mb-4">
                    <resource.icon className="h-6 w-6 text-brand-red" />
                  </div>
                  <h3 className="font-semibold text-text-dark mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-text-medium">
                    {resource.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply-now" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-dark mb-6">
              Apply to Join Our Program
            </h2>
            <p className="text-lg text-text-medium">
              Start earning commissions in just 24 hours with our quick approval
              process
            </p>
          </div>

          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" placeholder="Enter your first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" placeholder="Enter your last name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website/Social Media *</Label>
                  <Input
                    id="website"
                    placeholder="Your website or main social media profile"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="audience">Describe Your Audience *</Label>
                  <Input
                    id="audience"
                    placeholder="Who do you reach? (e.g., small business owners, students, freelancers)"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="experience">
                    Affiliate Marketing Experience
                  </Label>
                  <Textarea
                    id="experience"
                    placeholder="Tell us about your experience with affiliate marketing and promoting similar products..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="strategy">Promotion Strategy *</Label>
                  <Textarea
                    id="strategy"
                    placeholder="How do you plan to promote PdfPage? (content marketing, email, social media, paid ads, etc.)"
                    rows={4}
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">
                      Application Requirements:
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>• Active website or strong social media presence</li>
                      <li>• Quality content relevant to our target audience</li>
                      <li>
                        • Compliance with our terms and promotional guidelines
                      </li>
                      <li>• No spam or unethical marketing practices</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  className="w-full bg-brand-red hover:bg-red-700"
                  size="lg"
                >
                  Submit Application
                </Button>
                <p className="text-sm text-text-light text-center mt-3">
                  We'll review your application and get back to you within 24
                  hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-dark mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-text-dark mb-2">
                  When do I get paid?
                </h3>
                <p className="text-text-medium">
                  Commission payments are made monthly via PayPal, bank
                  transfer, or cryptocurrency. Minimum payout threshold is $100.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-text-dark mb-2">
                  How long do cookies last?
                </h3>
                <p className="text-text-medium">
                  Our cookies last 90 days, giving you plenty of time to earn
                  commissions from your referrals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-text-dark mb-2">
                  Can I promote via paid advertising?
                </h3>
                <p className="text-text-medium">
                  Yes! You can use Google Ads, Facebook Ads, and other paid
                  channels. We just ask that you don't bid on our branded terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-text-dark mb-2">
                  Is there an approval process?
                </h3>
                <p className="text-text-medium">
                  Yes, we manually review all applications to ensure quality.
                  Most applications are approved within 24 hours.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Affiliate;
