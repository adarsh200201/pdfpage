import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundarySimple extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              🚨 React Error Detected
            </h1>
            
            <div className="bg-red-100 p-4 rounded mb-4">
              <h2 className="font-semibold text-red-800 mb-2">Error Message:</h2>
              <pre className="text-sm text-red-700 whitespace-pre-wrap">
                {this.state.error?.message}
              </pre>
            </div>

            <div className="bg-gray-100 p-4 rounded mb-4">
              <h2 className="font-semibold text-gray-800 mb-2">Stack Trace:</h2>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
                {this.state.error?.stack}
              </pre>
            </div>

            <div className="bg-blue-100 p-4 rounded mb-4">
              <h2 className="font-semibold text-blue-800 mb-2">Component Stack:</h2>
              <pre className="text-xs text-blue-600 whitespace-pre-wrap overflow-auto max-h-40">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
            
            <button
              onClick={() => this.setState({ hasError: false })}
              className="ml-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundarySimple;
