import React from "react";
import { AlertTriangle, RefreshCw, Wifi, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface PaymentErrorHandlerProps {
  error: Error | null;
  onRetry: () => void;
  loading?: boolean;
  className?: string;
}

export function PaymentErrorHandler({
  error,
  onRetry,
  loading = false,
  className,
}: PaymentErrorHandlerProps) {
  if (!error) return null;

  const getErrorInfo = (error: Error) => {
    const message = error.message.toLowerCase();

    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection")
    ) {
      return {
        icon: Wifi,
        title: "Connection Error",
        description: "Please check your internet connection and try again.",
        actionText: "Retry Connection",
        variant: "destructive" as const,
      };
    }

    if (message.includes("login") || message.includes("unauthorized")) {
      return {
        icon: CreditCard,
        title: "Authentication Required",
        description: "Please login to continue with the payment.",
        actionText: "Login & Retry",
        variant: "destructive" as const,
      };
    }

    if (message.includes("invalid") || message.includes("validation")) {
      return {
        icon: AlertTriangle,
        title: "Invalid Payment Data",
        description: "Please check your payment details and try again.",
        actionText: "Try Again",
        variant: "destructive" as const,
      };
    }

    if (message.includes("service") || message.includes("server")) {
      return {
        icon: AlertTriangle,
        title: "Service Unavailable",
        description:
          "Payment service is temporarily down. Please try again in a few minutes.",
        actionText: "Retry Payment",
        variant: "destructive" as const,
      };
    }

    // Default error
    return {
      icon: AlertTriangle,
      title: "Payment Error",
      description: error.message,
      actionText: "Try Again",
      variant: "destructive" as const,
    };
  };

  const errorInfo = getErrorInfo(error);
  const Icon = errorInfo.icon;

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="pt-6">
        <Alert variant={errorInfo.variant}>
          <Icon className="h-4 w-4" />
          <AlertTitle className="mb-2">{errorInfo.title}</AlertTitle>
          <AlertDescription className="mb-4">
            {errorInfo.description}
          </AlertDescription>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={onRetry}
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {errorInfo.actionText}
                </>
              )}
            </Button>
          </div>
        </Alert>

        {/* Mobile-specific troubleshooting */}
        <div className="mt-4 text-sm text-gray-600">
          <details className="cursor-pointer">
            <summary className="font-medium mb-2">Troubleshooting Tips</summary>
            <ul className="space-y-1 text-xs">
              <li>• Check your internet connection</li>
              <li>• Ensure you're logged in</li>
              <li>• Try refreshing the page</li>
              <li>• Disable ad blockers if any</li>
              <li>• Try a different browser or device</li>
            </ul>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentErrorHandler;
