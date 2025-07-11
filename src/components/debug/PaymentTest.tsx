import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createPayment } from "@/services/paymentService";
import PaymentErrorHandler from "@/components/ui/payment-error-handler";
import {
  Smartphone,
  Monitor,
  Wifi,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PaymentTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    apiConnection: boolean | null;
    paymentService: boolean | null;
    mobileView: boolean | null;
    desktopView: boolean | null;
  }>({
    apiConnection: null,
    paymentService: null,
    mobileView: null,
    desktopView: null,
  });
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const runTests = async () => {
    setTesting(true);
    setError(null);
    setResults({
      apiConnection: null,
      paymentService: null,
      mobileView: null,
      desktopView: null,
    });

    try {
      // Test API Connection
      console.log("Testing API connection...");
      const apiUrl = "https://pdfpage-app.onrender.com/api";

      try {
        const healthResponse = await fetch(`${apiUrl}/health`);
        setResults((prev) => ({ ...prev, apiConnection: healthResponse.ok }));
      } catch (e) {
        setResults((prev) => ({ ...prev, apiConnection: false }));
      }

      // Test Payment Service
      console.log("Testing payment service...");
      try {
        await createPayment({
          amount: 100, // Test amount
          currency: "INR",
          planType: "monthly",
          planName: "Test Plan",
        });
        setResults((prev) => ({ ...prev, paymentService: true }));
      } catch (e) {
        console.log("Payment test error (expected):", e);
        // This might fail due to auth, which is expected
        setResults((prev) => ({
          ...prev,
          paymentService: (e as Error).message.includes("login"),
        }));
      }

      // Test Mobile View
      const isMobile = window.innerWidth < 768;
      setResults((prev) => ({ ...prev, mobileView: isMobile }));

      // Test Desktop View
      const isDesktop = window.innerWidth >= 768;
      setResults((prev) => ({ ...prev, desktopView: isDesktop }));

      toast({
        title: "Test Complete",
        description: "Payment system diagnostics finished",
      });
    } catch (error) {
      console.error("Test error:", error);
      setError(error as Error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <Loader2 className="w-4 h-4 animate-spin" />;
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return "Testing...";
    return status ? "Working" : "Error";
  };

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return "secondary";
    return status ? "success" : "destructive";
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment System Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTests} disabled={testing} className="w-full">
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run Payment Tests"
            )}
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Connection */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">API Connection</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(results.apiConnection)}
                <Badge variant={getStatusColor(results.apiConnection) as any}>
                  {getStatusText(results.apiConnection)}
                </Badge>
              </div>
            </div>

            {/* Payment Service */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Payment Service</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(results.paymentService)}
                <Badge variant={getStatusColor(results.paymentService) as any}>
                  {getStatusText(results.paymentService)}
                </Badge>
              </div>
            </div>

            {/* Mobile View */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">Mobile View</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(results.mobileView)}
                <Badge variant={getStatusColor(results.mobileView) as any}>
                  {results.mobileView === null
                    ? "Testing..."
                    : results.mobileView
                      ? "Active"
                      : "Desktop"}
                </Badge>
              </div>
            </div>

            {/* Desktop View */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium">Desktop View</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(results.desktopView)}
                <Badge variant={getStatusColor(results.desktopView) as any}>
                  {results.desktopView === null
                    ? "Testing..."
                    : results.desktopView
                      ? "Active"
                      : "Mobile"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Environment Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Environment Info</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>
                API URL: {import.meta.env.VITE_API_URL || "Not configured"}
              </div>
              <div>Screen Width: {window.innerWidth}px</div>
              <div>
                User Agent:{" "}
                {navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"}
              </div>
              <div>
                Connection:{" "}
                {(navigator as any).connection?.effectiveType || "Unknown"}
              </div>
            </div>
          </div>

          {/* Error Handler */}
          {error && (
            <PaymentErrorHandler
              error={error}
              onRetry={() => {
                setError(null);
                runTests();
              }}
              loading={testing}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentTest;
