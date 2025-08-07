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
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NetlifyEnvironmentFixer: React.FC = () => {
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

  const redirectsContent = `# Netlify redirects - proxy API calls to Google Cloud Run
/api/* https://pdf-backend-935131444417.asia-south1.run.app/api/:splat 200!`;

  const conflictingVars = [
    {
      name: 'VITE_API_URL',
      value: 'https://pdf-backend-935131444417.asia-south1.run.app/api',
      status: 'keep',
      description: 'Correct - Points to your Google Cloud Run backend'
    },
    {
      name: 'VITE_API_URL',
      value: 'https://pdfpage.in',
      status: 'delete',
      description: 'Incorrect - Causing OAuth redirect conflicts'
    }
  ];

  const allRedirectURIs = [
    'https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback',
    'https://your-netlify-site.netlify.app/api/auth/google/callback',
    'https://pdfpage.in/api/auth/google/callback'
  ];

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            Netlify Environment Variable Conflict Detected!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Root Cause Found:</strong> You have TWO different VITE_API_URL environment variables 
              in your Netlify deployment, causing OAuth redirect URI confusion.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-red-800">Conflicting Environment Variables:</h3>
            {conflictingVars.map((envVar, index) => (
              <div key={index} className={`p-3 border rounded-md ${
                envVar.status === 'keep' ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={envVar.status === 'keep' ? 'default' : 'destructive'}>
                      {envVar.name}
                    </Badge>
                    {envVar.status === 'keep' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      {envVar.status === 'keep' ? 'KEEP THIS' : 'DELETE THIS'}
                    </span>
                  </div>
                </div>
                <div className="font-mono text-sm bg-white p-2 rounded border">
                  {envVar.value}
                </div>
                <p className="text-xs mt-1 text-gray-600">{envVar.description}</p>
              </div>
            ))}
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
                <h3 className="font-semibold text-red-800">Clean Up Netlify Environment Variables</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Remove the duplicate VITE_API_URL that&apos;s pointing to the wrong domain.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open('https://app.netlify.com/', '_blank')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Netlify Dashboard
                  </Button>
                  <div className="text-sm text-gray-600">
                    Navigate to: Site Settings → Environment Variables → Delete the VITE_API_URL with value &quot;https://pdfpage.in&quot;
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Update Google OAuth Console</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Add ALL possible redirect URIs to handle different deployment scenarios:
                </p>
                <div className="space-y-2">
                  {allRedirectURIs.map((uri, index) => (
                    <div key={index} className="font-mono text-sm bg-gray-50 p-2 rounded border flex items-center justify-between">
                      <span className="break-all">{uri}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(uri, `Redirect URI ${index + 1}`)}
                        className="ml-2 flex-shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedItem === `Redirect URI ${index + 1}` ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                  className="mt-3"
                  variant="outline"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Google Cloud Console
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Add Netlify Redirects</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create a _redirects file to proxy API calls properly:
                </p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded border font-mono text-sm">
                  <pre>{redirectsContent}</pre>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(redirectsContent, '_redirects content')}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy _redirects
                  </Button>
                  <span className="text-xs text-gray-600 self-center">
                    Place this file in your build output directory (dist/build)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Deploy and Test</h3>
                <p className="text-sm text-gray-600">
                  After making these changes:
                </p>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• Redeploy your Netlify site</li>
                  <li>• Wait 5-10 minutes for Google OAuth changes to propagate</li>
                  <li>• Test Google Sign In again</li>
                  <li>• Should work without redirect URI errors</li>
                </ul>
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Expected Result:</strong> After these fixes, your OAuth flow will use consistent 
              redirect URIs and the &quot;redirect_uri_mismatch&quot; error will be resolved.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <ArrowRight className="w-5 h-5" />
            Current Configuration Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Current VITE_API_URL (local):</strong> {import.meta.env.VITE_API_URL}</div>
            <div><strong>Problem:</strong> Netlify has conflicting VITE_API_URL values</div>
            <div><strong>Solution:</strong> Remove duplicate, update OAuth URIs, add redirects</div>
            <div><strong>OAuth Client ID:</strong> 924753913138-7fdalk1kou5esta2gj837nfs6sht4ci1</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetlifyEnvironmentFixer;
