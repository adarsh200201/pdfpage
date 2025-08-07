import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Copy,
  ExternalLink,
  Settings,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NetlifyProxyFixer: React.FC = () => {
  const { toast } = useToast();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      toast({
        title: "Copied!",
        description: `${item} copied to clipboard`,
      });
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive"
      });
    }
  };

  const netlifyRedirects = `# Netlify redirects for OAuth
/api/* https://pdf-backend-935131444417.asia-south1.run.app/api/:splat 200!
/auth/* https://pdf-backend-935131444417.asia-south1.run.app/auth/:splat 200!`;

  const netlifyToml = `[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "https://pdf-backend-935131444417.asia-south1.run.app/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/auth/*"
  to = "https://pdf-backend-935131444417.asia-south1.run.app/auth/:splat"
  status = 200
  force = true`;

  const correctRedirectURIs = [
    {
      uri: 'https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback',
      description: 'Direct Google Cloud Run backend',
      priority: 'REQUIRED',
      type: 'Backend Direct'
    },
    {
      uri: 'https://your-netlify-domain.netlify.app/api/auth/google/callback',
      description: 'Netlify domain with proxy (if using Netlify deployment)',
      priority: 'OPTIONAL',
      type: 'Netlify Proxy'
    },
    {
      uri: 'https://pdfpage.in/api/auth/google/callback',
      description: 'Production domain (if you have a custom domain)',
      priority: 'OPTIONAL',
      type: 'Custom Domain'
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            OAuth Redirect URI Still Wrong!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>The error persists:</strong> Your Google OAuth client is still configured for 
              <code className="mx-1 px-1 bg-red-200 rounded">https://pdfpage-app.onrender.com/api/auth/google/callback</code>
              instead of your current backend. This needs to be fixed in Google Cloud Console.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-white border border-red-300 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">Current Error Analysis:</h3>
            <ul className="text-sm space-y-1 text-red-700">
              <li>• Google OAuth client ID: <code>924753913138-7fdalk1kou5esta2gj837nfs6sht4ci1.apps.googleusercontent.com</code></li>
              <li>• ❌ Configured redirect URI: <code>https://pdfpage-app.onrender.com/api/auth/google/callback</code></li>
              <li>• ✅ Should be: <code>https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Step-by-Step Fix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">URGENT: Update Google Cloud Console</h3>
                <p className="text-sm text-gray-600 mb-3">
                  The OAuth client redirect URI must be updated immediately.
                </p>
                <Button
                  onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Google Cloud Console
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Update Authorized Redirect URIs</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Replace the old Render URL with these correct URIs:
                </p>
                <div className="space-y-3">
                  {correctRedirectURIs.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.priority === 'REQUIRED' ? 'destructive' : 'secondary'}>
                            {item.priority}
                          </Badge>
                          <Badge variant="outline">{item.type}</Badge>
                        </div>
                      </div>
                      <div className="font-mono text-sm bg-white p-2 rounded border flex items-center justify-between">
                        <span className="break-all">{item.uri}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(item.uri, `URI ${index + 1}`)}
                          className="ml-2 flex-shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedItem === `URI ${index + 1}` ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Netlify Proxy Configuration (Optional)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  If you&apos;re deploying to Netlify, add these proxy rules:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Option 1: _redirects file</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded border font-mono text-sm">
                      <pre>{netlifyRedirects}</pre>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(netlifyRedirects, '_redirects content')}
                      className="mt-2"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy _redirects
                    </Button>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Option 2: netlify.toml file</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded border font-mono text-sm">
                      <pre>{netlifyToml}</pre>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(netlifyToml, 'netlify.toml content')}
                      className="mt-2"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy netlify.toml
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Priority:</strong> The main issue is the Google OAuth client configuration. 
              Update that first, then configure Netlify proxy if needed. 
              The OAuth should work immediately after updating Google Cloud Console.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Globe className="w-5 h-5" />
            Current Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Frontend API URL:</strong> {import.meta.env.VITE_API_URL}</div>
            <div><strong>Current Domain:</strong> {window.location.origin}</div>
            <div><strong>OAuth Client ID:</strong> 924753913138-7fdalk1kou5esta2gj837nfs6sht4ci1</div>
            <div><strong>Expected Callback:</strong> https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetlifyProxyFixer;
