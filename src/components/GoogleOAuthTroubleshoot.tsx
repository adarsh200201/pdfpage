import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const GoogleOAuthTroubleshoot: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    setResults(null);

    const diagnostics = {
      currentDomain: window.location.origin,
      expectedCallback: `${window.location.origin}/auth/callback`,
      backendHealth: false,
      oauthEndpoint: false,
      configIssue: null
    };

    try {
      // Test backend health
      const healthResponse = await fetch('https://pdf-backend-935131444417.asia-south1.run.app/api/health');
      diagnostics.backendHealth = healthResponse.ok;

      // Test OAuth endpoint
      try {
        const oauthResponse = await fetch('https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google', {
          method: 'HEAD'
        });
        diagnostics.oauthEndpoint = oauthResponse.status === 302; // Should redirect
      } catch (error) {
        diagnostics.oauthEndpoint = false;
      }

      // Check for common config issues
      if (window.location.hostname === 'localhost') {
        diagnostics.configIssue = 'localhost_domain';
      } else if (!window.location.hostname.includes('pdfpage')) {
        diagnostics.configIssue = 'domain_mismatch';
      }

    } catch (error) {
      console.error('Diagnostics error:', error);
    }

    setResults(diagnostics);
    setTesting(false);
  };

  const testGoogleLogin = () => {
    // Store current page
    sessionStorage.setItem("authRedirectUrl", window.location.pathname);

    // Test the OAuth flow - use local backend for development
    const isDevelopment = window.location.hostname === 'localhost';
    const baseUrl = isDevelopment
      ? "http://localhost:5000"
      : "https://pdf-backend-935131444417.asia-south1.run.app";
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Google OAuth Troubleshoot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button 
            onClick={runDiagnostics} 
            disabled={testing}
            variant="outline"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Diagnostics'
            )}
          </Button>
          
          <Button 
            onClick={testGoogleLogin}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Test Google Login
          </Button>
        </div>

        {results && (
          <div className="space-y-3">
            <h3 className="font-semibold">Diagnostic Results:</h3>
            
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                {results.backendHealth ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">Backend Health: {results.backendHealth ? 'OK' : 'Failed'}</span>
              </div>

              <div className="flex items-center gap-2">
                {results.oauthEndpoint ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">OAuth Endpoint: {results.oauthEndpoint ? 'OK' : 'Failed'}</span>
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Current Domain:</strong> {results.currentDomain}</p>
              <p><strong>Expected Callback:</strong> {results.expectedCallback}</p>
            </div>

            {results.configIssue && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {results.configIssue === 'localhost_domain' && (
                    'You are on localhost. Google OAuth requires the backend to be configured with the correct redirect URI for your domain.'
                  )}
                  {results.configIssue === 'domain_mismatch' && (
                    'Domain mismatch detected. The backend may be configured for a different domain than your current one.'
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertDescription>
                <strong>Fix:</strong> The Google OAuth client on the backend needs to have your domain ({window.location.origin}) 
                added as an authorized redirect URI. Contact your backend admin to add: {results.expectedCallback}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleOAuthTroubleshoot;
