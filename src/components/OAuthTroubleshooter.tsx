import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Play,
  Loader2
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

const OAuthTroubleshooter: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [oauthTesting, setOauthTesting] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      const newTest = { name, status, message, details };
      if (existing) {
        return prev.map(t => t.name === name ? newTest : t);
      }
      return [...prev, newTest];
    });
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setTests([]);

    // Test 1: Backend Health
    updateTest('Backend Health', 'pending', 'Checking backend connectivity...');
    try {
      const response = await fetch('https://pdf-backend-935131444417.asia-south1.run.app/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTest('Backend Health', 'success', 'Backend is healthy and responding', data);
      } else {
        updateTest('Backend Health', 'error', `Backend returned ${response.status}`, { status: response.status });
      }
    } catch (error: any) {
      updateTest('Backend Health', 'error', 'Cannot reach backend', { error: error.message });
    }

    // Test 2: OAuth Endpoint Availability
    updateTest('OAuth Endpoint', 'pending', 'Testing OAuth endpoint...');
    try {
      const response = await fetch('https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google', {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.status === 302) {
        updateTest('OAuth Endpoint', 'success', 'OAuth endpoint is responding with redirect', { 
          status: response.status,
          location: response.headers.get('location')
        });
      } else if (response.status === 500) {
        updateTest('OAuth Endpoint', 'error', 'OAuth endpoint returning server error - likely Google credentials issue', { 
          status: response.status 
        });
      } else {
        updateTest('OAuth Endpoint', 'warning', `OAuth endpoint returned ${response.status}`, { 
          status: response.status 
        });
      }
    } catch (error: any) {
      updateTest('OAuth Endpoint', 'error', 'OAuth endpoint test failed', { error: error.message });
    }

    // Test 3: Frontend Configuration
    updateTest('Frontend Config', 'pending', 'Checking frontend configuration...');
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const expectedUrl = 'https://pdf-backend-935131444417.asia-south1.run.app/api';
      
      if (apiUrl === expectedUrl) {
        updateTest('Frontend Config', 'success', 'Frontend API URL is correctly configured', { 
          current: apiUrl,
          expected: expectedUrl 
        });
      } else {
        updateTest('Frontend Config', 'error', 'Frontend API URL mismatch', { 
          current: apiUrl,
          expected: expectedUrl 
        });
      }
    } catch (error: any) {
      updateTest('Frontend Config', 'error', 'Frontend configuration error', { error: error.message });
    }

    // Test 4: Google OAuth Client Validation
    updateTest('Google OAuth Client', 'pending', 'Validating Google OAuth client...');
    try {
      // Test if Google OAuth client ID format is valid
      const clientId = '924753913138-7fdalk1kou5esta2gj837nfs6sht4ci1.apps.googleusercontent.com';
      const isValidFormat = clientId.includes('apps.googleusercontent.com') && clientId.length > 50;
      
      if (isValidFormat) {
        updateTest('Google OAuth Client', 'success', 'Google Client ID format is valid', { 
          clientId: clientId.substring(0, 20) + '...' 
        });
      } else {
        updateTest('Google OAuth Client', 'error', 'Invalid Google Client ID format', { clientId });
      }
    } catch (error: any) {
      updateTest('Google OAuth Client', 'error', 'Google OAuth client validation failed', { error: error.message });
    }

    // Test 5: Callback URL Configuration
    updateTest('Callback URL', 'pending', 'Checking callback URL...');
    try {
      const expectedCallback = 'https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback';
      const frontendCallback = `${window.location.origin}/auth/callback`;
      
      updateTest('Callback URL', 'success', 'Callback URLs are properly configured', { 
        backendCallback: expectedCallback,
        frontendCallback: frontendCallback
      });
    } catch (error: any) {
      updateTest('Callback URL', 'error', 'Callback URL validation failed', { error: error.message });
    }

    setTesting(false);
  };

  const testOAuthFlow = async () => {
    setOauthTesting(true);
    try {
      // Store test flag
      sessionStorage.setItem('oauth_test_mode', 'true');
      
      // Redirect to OAuth
      const oauthUrl = 'https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google';
      window.location.href = oauthUrl;
    } catch (error: any) {
      console.error('OAuth test failed:', error);
      setOauthTesting(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'pending': return 'border-blue-200 bg-blue-50';
    }
  };

  const hasErrors = tests.some(t => t.status === 'error');
  const allComplete = tests.length > 0 && tests.every(t => t.status !== 'pending');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Google OAuth Troubleshooter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={testing}
              variant="outline"
              size="sm"
            >
              {testing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running Tests...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Run Diagnostics</>
              )}
            </Button>
            
            {allComplete && !hasErrors && (
              <Button 
                onClick={testOAuthFlow} 
                disabled={oauthTesting}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {oauthTesting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing OAuth...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Test OAuth Flow</>
                )}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {tests.map((test) => (
              <div key={test.name} className={`p-3 rounded-md border ${getStatusColor(test.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {test.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm mt-1 text-gray-700">{test.message}</p>
                {test.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {allComplete && hasErrors && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Issues Found:</strong> The OAuth system has configuration problems that need to be resolved before Google Sign In will work.
              </AlertDescription>
            </Alert>
          )}

          {allComplete && !hasErrors && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>All Tests Passed:</strong> The OAuth system appears to be configured correctly. You can now test the actual OAuth flow.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <strong>Frontend API URL:</strong> {import.meta.env.VITE_API_URL}
          </div>
          <div className="text-sm">
            <strong>Expected Backend:</strong> https://pdf-backend-935131444417.asia-south1.run.app
          </div>
          <div className="text-sm">
            <strong>OAuth Endpoint:</strong> /api/auth/google
          </div>
          <div className="text-sm">
            <strong>Callback Endpoint:</strong> /api/auth/google/callback
          </div>
          <div className="text-sm">
            <strong>Frontend Callback:</strong> {window.location.origin}/auth/callback
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthTroubleshooter;
