import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallbackMessage?: string;
  showRefresh?: boolean;
}

interface ErrorBoundaryWrapperState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Simple error boundary wrapper to catch frame-related and other JavaScript errors
 * This prevents the entire application from crashing due to component errors
 */
class ErrorBoundaryWrapper extends Component<
  ErrorBoundaryWrapperProps,
  ErrorBoundaryWrapperState
> {
  constructor(props: ErrorBoundaryWrapperProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryWrapperState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundaryWrapper caught an error:", error, errorInfo);

    // Check for specific frame-related errors
    if (
      error.message.includes("frame") ||
      error.message.includes("ErrorOverlay") ||
      error.message.includes("getDefaultStylesForTag") ||
      error.message.includes("domNodeToElement")
    ) {
      console.warn("Frame-related error caught and handled:", error.message);
    }

    this.setState({
      error,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200 min-h-[400px]">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>

          <p className="text-gray-600 text-center mb-6 max-w-md">
            {this.props.fallbackMessage ||
              "We encountered an error while rendering this component. Please try again."}
          </p>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mb-6 p-4 bg-gray-100 rounded border max-w-2xl">
              <summary className="cursor-pointer font-medium text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                {this.state.error.message}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="outline">
              Try Again
            </Button>
            {this.props.showRefresh !== false && (
              <Button onClick={this.handleRefreshPage}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWrapper;
