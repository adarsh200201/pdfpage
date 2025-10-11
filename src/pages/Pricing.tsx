import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Check,
  Crown,
  Star,
  Zap,
  Shield,
  Infinity,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createPayment, processPayment } from "@/services/paymentService";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";

const Pricing = () => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribe = async (planType: "monthly" | "quarterly") => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setProcessingPlan(planType);

    try {
      const amount = planType === "quarterly" ? 2900 : 1100; // in paise - ₹29 for 3 months, ₹11 for 1 month
      const planName =
        planType === "quarterly" ? "Quarterly Premium" : "Monthly Premium";

      console.log("Starting payment process for:", { planType, amount });

      const orderId = await createPayment({
        amount,
        currency: "INR",
        planType,
        planName,
      });

      console.log("Payment order created:", orderId);

      const paymentResult = await processPayment(
        orderId,
        user!.email,
        user!.name,
        planType,
      );

      // Refresh user data to get updated premium status
      await refreshAuth();

      // Handle queued vs immediate plan activation
      if (paymentResult.planQueued) {
        const activationDate = new Date(
          paymentResult.planActivationDate,
        ).toLocaleDateString();
        toast({
          title: "Payment Successful!",
          description: `Your ${planName} plan has been purchased and will start on ${activationDate} after your current plan expires.`,
        });
      } else {
        toast({
          title: "Payment Successful!",
          description: `Welcome to ${planName}! Enjoy unlimited PDF processing.`,
        });
      }

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      console.error("Payment error:", error);

      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const features = {
    free: [
      "3 PDF operations per day",
      "Basic PDF merge & split",
      "File size limit: 25MB",
      "Standard processing speed",
      "Community support",
    ],
    premium: [
      "Unlimited PDF operations",
      "All PDF tools available",
      "File size limit: 100MB",
      "Priority processing",
      "Advanced features (OCR, etc.)",
      "No ads or watermarks",
      "Priority email support",
      "Cloud storage integration",
    ],
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-heading-large text-text-dark mb-6">
            Choose Your Plan
          </h1>
          <p className="text-body-large text-text-light max-w-3xl mx-auto">
            Start free or unlock unlimited PDF processing with our premium
            plans. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-heading-small text-text-dark mb-2">Free</h3>
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-text-dark">₹0</span>
                <span className="text-text-light ml-2">/month</span>
              </div>
              <p className="text-body-medium text-text-light">
                Perfect for occasional PDF tasks
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-body-medium text-text-dark">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              variant="outline"
              disabled={isAuthenticated && !user?.isPremium}
            >
              {isAuthenticated && !user?.isPremium ? "Current Plan" : "Sign Up"}
            </Button>
          </div>

          {/* Monthly Premium */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-brand-red relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-brand-red text-white px-4 py-2 rounded-full text-sm font-medium">
                Popular
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-heading-small text-text-dark mb-2">
                Premium Monthly
              </h3>
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-text-dark">₹11</span>
                <span className="text-text-light ml-2">/month</span>
              </div>
              <p className="text-body-medium text-text-light">
                Full access to all premium features
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-body-medium text-text-dark">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-brand-red hover:bg-red-600"
              onClick={() => handleSubscribe("monthly")}
              disabled={processingPlan === "monthly"}
            >
              {processingPlan === "monthly" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : user?.isPremium ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Renew Monthly Plan
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Start Monthly Plan
                </>
              )}
            </Button>
          </div>

          {/* Yearly Premium */}
          <div className="bg-gradient-to-br from-brand-yellow to-yellow-400 rounded-2xl p-8 shadow-lg relative text-black">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Best Value
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-heading-small text-black mb-2">
                Premium Quarterly
              </h3>
              <div className="flex items-center justify-center mb-2">
                <span className="text-4xl font-bold text-black">₹29</span>
                <span className="text-gray-700 ml-2">/3 months</span>
              </div>
              <div className="flex items-center justify-center mb-4">
                <span className="text-sm line-through text-gray-600">₹33</span>
                <span className="text-sm font-medium text-green-700 ml-2">
                  Save ₹4!
                </span>
              </div>
              <p className="text-body-medium text-gray-700">
                Best value for 3 months + all premium features
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-body-medium text-black">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-black text-white hover:bg-gray-800"
              onClick={() => handleSubscribe("quarterly")}
              disabled={processingPlan === "quarterly"}
            >
              {processingPlan === "quarterly" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : user?.isPremium ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Quarterly
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Start Quarterly Plan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-heading-medium text-text-dark text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-text-dark mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-body-medium text-text-light">
                Yes, you can cancel your subscription at any time. You'll
                continue to have access to premium features until the end of
                your billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-text-dark mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-body-medium text-text-light">
                Absolutely. We use Razorpay's secure payment processing, which
                is PCI DSS compliant and uses industry-standard encryption to
                protect your payment information.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-text-dark mb-2">
                What happens to my files?
              </h3>
              <p className="text-body-medium text-text-light">
                All files are automatically deleted from our servers after 1
                hour. We never store your documents permanently and your privacy
                is always protected.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-8 text-text-light">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              <span className="text-sm">SSL Encrypted</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              <span className="text-sm">Instant Processing</span>
            </div>
            <div className="flex items-center">
              <Infinity className="w-5 h-5 mr-2" />
              <span className="text-sm">Unlimited Usage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
      />
    </div>
  );
};

export default Pricing;
