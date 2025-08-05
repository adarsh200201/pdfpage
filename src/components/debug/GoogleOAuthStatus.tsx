import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Play } from 'lucide-react';
import { getFullApiUrl } from '@/lib/api-config';
import { runOAuthTests, testGoogleOAuthReadiness } from '@/utils/oauth-test';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
}

const GoogleOAuthStatus: React.FC = () => {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const updateTestResult = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTestResults(prev => {
      const existing = prev.find(t => t.name === name);
      const newResult = { name, status, message, details };
      if (existing) {
        return prev.map(t => t.name === name ? newResult : t);
      }
      return [...prev, newResult];
    });
  };

  const runConnectivityTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      // Run comprehensive OAuth tests
      const results = await runOAuthTests();

      // Convert results to our format
      results.forEach(result => {
        updateTestResult(
          result.test,
          result.status,
          result.message,
          result.details ? JSON.stringify(result.details, null, 2) : undefined
        );
      });

      // Test current authentication state
      updateTestResult('Auth State', 'pending', 'Checking current authentication...');
      if (isAuthenticated && user) {
        updateTestResult('Auth State', 'success', `Authenticated as ${user.email}`,
          `User ID: ${user.id}, Premium: ${user.isPremium}`);
      } else {
        updateTestResult('Auth State', 'warning', 'Not currently authenticated', 'Ready for login');
      }

      // Test API configuration
      updateTestResult('API Config', 'pending', 'Checking API configuration...');
      try {
        const apiUrl = getFullApiUrl('/api/auth/me');
        updateTestResult('API Config', 'success', 'API URL configured correctly', `URL: ${apiUrl}`);
      } catch (error: any) {
        updateTestResult('API Config', 'error', 'API configuration error', error.message);
      }

      // Test OAuth readiness
      updateTestResult('OAuth Readiness', 'pending', 'Evaluating overall system readiness...');
      const readiness = await testGoogleOAuthReadiness();
      updateTestResult(
        'OAuth Readiness',
        readiness.isReady ? 'success' : 'error',
        readiness.summary,
        readiness.issues.join('\n')
      );

    } catch (error: any) {
      updateTestResult('Test Runner', 'error', 'Failed to run tests', error.message);
    }

    setIsRunningTests(false);
  };

  const handleGoogleLogin = async () => {
    try {
      updateTestResult('OAuth Flow', 'pending', 'Initiating Google OAuth...');
      await loginWithGoogle();
      updateTestResult('OAuth Flow', 'success', 'OAuth flow started successfully', 'Redirecting to Google...');
    } catch (error: any) {
      updateTestResult('OAuth Flow', 'error', 'Failed to start OAuth flow', error.message);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
    }
  };

  useEffect(() => {
    runConnectivityTests();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Google OAuth System Status
            <Button 
              onClick={runConnectivityTests}
              disabled={isRunningTests}
              size="sm"
              variant="outline"
            >
              {isRunningTests ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Retest
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Authentication Status */}
          {isAuthenticated && user ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <AlertDescription>
                <div className="font-semibold">Currently Authenticated</div>
                <div className="text-sm">
                  User: {user.email} | Name: {user.name} | Premium: {user.isPremium ? 'Yes' : 'No'}
                </div>
                <Button onClick={logout} size="sm" variant="outline" className="mt-2">
                  Logout
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="w-4 h-4 text-blue-500" />
              <AlertDescription>
                <div className="font-semibold">Not Authenticated</div>
                <div className="text-sm">Ready to test Google OAuth login</div>
                <Button onClick={handleGoogleLogin} size="sm" className="mt-2">
                  Test Google Login
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Test Results */}
          <div className="space-y-3">
            <h4 className="font-semibold">System Tests</h4>
            {testResults.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {result.status}
                  </Badge>
                </div>
                <div className="text-sm">{result.message}</div>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-gray-600">Details</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {result.details}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {/* Email Test Specific */}
          <Alert className="bg-purple-50 border-purple-200">
            <AlertTriangle className="w-4 h-4 text-purple-500" />
            <AlertDescription>
              <div className="font-semibold">Testing for: adarshkumar200201@gmail.com</div>
              <div className="text-sm">
                The OAuth system will create a new account or log into existing account for this email.
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleOAuthStatus;
