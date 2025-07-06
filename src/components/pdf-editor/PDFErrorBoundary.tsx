import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface PDFErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface PDFErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class PDFErrorBoundary extends Component<
  PDFErrorBoundaryProps,
  PDFErrorBoundaryState
> {
  constructor(props: PDFErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): PDFErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("PDF Error Boundary caught an error:", error, errorInfo);

    // Check if it's a PDF.js version mismatch error
    if (
      error.message.includes("version") &&
      (error.message.includes("does not match") ||
        error.message.includes("Worker"))
    ) {
      console.error("PDF.js version mismatch detected:", error.message);
    }

    this.setState({
      error,
      errorInfo: error.message + "\n" + errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a version mismatch error
      const isVersionMismatch =
        this.state.error?.message.includes("version") &&
        (this.state.error?.message.includes("does not match") ||
          this.state.error?.message.includes("Worker"));

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isVersionMismatch
              ? "PDF Viewer Configuration Error"
              : "PDF Processing Error"}
          </h3>

          <p className="text-gray-600 text-center mb-6 max-w-md">
            {isVersionMismatch
              ? "There's a version mismatch in the PDF viewer. This is a common issue that can be resolved by refreshing the page."
              : "Something went wrong while processing the PDF. Please try again."}
          </p>

          {process.env.NODE_ENV === "development" && (
            <details className="mb-6 p-4 bg-gray-100 rounded border max-w-2xl">
              <summary className="cursor-pointer font-medium text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                {this.state.errorInfo}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="outline">
              Try Again
            </Button>
            <Button onClick={this.handleRefreshPage}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>

          {isVersionMismatch && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Technical Note:</strong> This error occurs when there's a
              mismatch between the PDF.js library version and the web worker
              version. Refreshing the page should resolve this issue.
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default PDFErrorBoundary;
