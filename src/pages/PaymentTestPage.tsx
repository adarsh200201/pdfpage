import React from "react";
import Header from "@/components/layout/Header";
import PaymentTest from "@/components/debug/PaymentTest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function PaymentTestPage() {
  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-heading-large text-text-dark mb-4">
            Payment System Test
          </h1>
          <p className="text-body-large text-text-light">
            Diagnose payment issues for mobile and desktop environments
          </p>
        </div>

        <Alert className="mb-8">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            This test page helps identify and resolve payment-related errors.
            Use this tool to check API connectivity, payment service status, and
            view compatibility across different devices.
          </AlertDescription>
        </Alert>

        <PaymentTest />

        {/* Additional Information */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Mobile Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• Network connectivity problems</p>
              <p>• Ad blockers blocking payment scripts</p>
              <p>• Safari payment popup restrictions</p>
              <p>• Touch event handling issues</p>
              <p>• Viewport scaling problems</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Desktop Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• CORS policy restrictions</p>
              <p>• Browser extension interference</p>
              <p>• Cache and cookie issues</p>
              <p>• Environment variable misconfiguration</p>
              <p>• API endpoint unreachable</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Check Environment</h4>
                <p className="text-sm text-gray-600">
                  Ensure VITE_API_URL and VITE_RAZORPAY_KEY_ID are properly
                  configured in your .env file.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Verify Backend</h4>
                <p className="text-sm text-gray-600">
                  Make sure the backend server at
                  https://pdfpage-app.onrender.com is accessible and the
                  payments route is working.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Test Authentication</h4>
                <p className="text-sm text-gray-600">
                  Payment endpoints require authentication. Make sure users are
                  logged in before attempting payments.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. Check Network</h4>
                <p className="text-sm text-gray-600">
                  Test with different networks, disable VPN/proxy, and check
                  browser developer tools for network errors.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
